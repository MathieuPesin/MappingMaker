import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { supabase } from '../supabaseClient';
import { 
  EyeIcon, 
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  LinkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import EditEntrepriseModal from './EditEntrepriseModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const VisualMapping = () => {
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef();

  const colors = d3.scaleOrdinal(d3.schemeSet3);

  useEffect(() => {
    fetchData();
  }, []);

  const parseCategories = (categorieStr) => {
    if (!categorieStr) return [];

    // Fonction pour nettoyer une catégorie
    const cleanCategory = (cat) => {
      if (!cat) return '';
      return cat
        .replace(/[\{\}\[\]"\\]/g, '') // Enlever les accolades, crochets, guillemets et backslashes
        .replace(/\s+/g, ' ') // Normaliser les espaces
        .trim(); // Enlever les espaces au début et à la fin
    };

    try {
      // Si c'est un tableau JSON
      if (typeof categorieStr === 'string' && (
        categorieStr.startsWith('[') || 
        categorieStr.startsWith('{')
      )) {
        try {
          const parsed = JSON.parse(categorieStr);
          if (Array.isArray(parsed)) {
            return parsed.map(cleanCategory).filter(Boolean);
          }
        } catch (e) {
          // Continue avec le traitement normal si le parse échoue
        }
      }

      // Traiter comme une chaîne simple avec des virgules
      return categorieStr
        .split(',')
        .map(cleanCategory)
        .filter(Boolean); // Enlever les valeurs vides
    } catch (e) {
      console.error('Error parsing categories:', e);
      return [cleanCategory(categorieStr)];
    }
  };

  const fetchData = async () => {
    try {
      // Vérifier d'abord si l'utilisateur est connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setLoading(false);
        return;
      }

      // Récupérer les entreprises
      const { data: companiesData, error: companiesError } = await supabase
        .from('entreprises')
        .select('*')
        .eq('user_id', user.id);

      if (companiesError) throw companiesError;

      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      console.log('Fetched data from Supabase:', {
        companies: companiesData,
        categories: categoriesData
      });

      const processedCompanies = companiesData.map(company => ({
        ...company,
        categories: parseCategories(company.categorie)
      }));

      setCompanies(processedCompanies);

      // Fusionner les catégories de la table categories et celles des entreprises
      const allCategories = new Set();
      
      // Ajouter les catégories de la table categories
      categoriesData.forEach(cat => allCategories.add(cat.name));
      
      // Ajouter les catégories des entreprises
      processedCompanies.forEach(company => {
        company.categories.forEach(cat => allCategories.add(cat));
      });
      
      setCategories([...allCategories]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setHiddenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleZoomIn = () => {
    setTransform(prev => ({ ...prev, scale: prev.scale * 1.2 }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({ ...prev, scale: prev.scale / 1.2 }));
  };

  const handleMove = (direction) => {
    const moveAmount = 50;
    setTransform(prev => {
      switch (direction) {
        case 'up':
          return { ...prev, y: prev.y - moveAmount };
        case 'down':
          return { ...prev, y: prev.y + moveAmount };
        case 'left':
          return { ...prev, x: prev.x - moveAmount };
        case 'right':
          return { ...prev, x: prev.x + moveAmount };
        default:
          return prev;
      }
    });
  };

  const calculateLayout = () => {
    if (!companies.length || !categories.length) {
      console.log('Missing required data:', {
        companiesLength: companies.length,
        categoriesLength: categories.length
      });
      return null;
    }

    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3; // Augmenté pour plus d'espace

    // Calculer les positions des centres des cercles de catégories
    const categoryPositions = {};
    const angleStep = (2 * Math.PI) / categories.length;
    
    categories.forEach((category, i) => {
      if (hiddenCategories.has(category)) return;
      
      const angle = i * angleStep - Math.PI / 2;
      categoryPositions[category] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        color: colors(i),
        angle: angle
      };
    });

    // Calculer les positions des entreprises avec distribution radiale
    const companyPositions = {};
    const usedPositions = new Set(); // Pour éviter les superpositions

    const isPositionTaken = (x, y, margin = 60) => {
      return Array.from(usedPositions).some(pos => {
        const [px, py] = pos.split(',').map(Number);
        const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
        return distance < margin;
      });
    };

    const findAvailablePosition = (baseX, baseY, radiusStart = 0, angleOffset = 0) => {
      const spiralStep = 10;
      let currentRadius = radiusStart;
      let currentAngle = angleOffset;
      
      while (currentRadius < 200) { // Limite de recherche
        const x = baseX + currentRadius * Math.cos(currentAngle);
        const y = baseY + currentRadius * Math.sin(currentAngle);
        
        if (!isPositionTaken(x, y)) {
          usedPositions.add(`${x},${y}`);
          return { x, y };
        }
        
        currentAngle += 0.5; // Rotation plus progressive
        currentRadius += spiralStep / (2 * Math.PI); // Augmentation progressive du rayon
      }
      
      return { x: baseX, y: baseY }; // Position par défaut si aucune position libre n'est trouvée
    };

    companies.forEach(company => {
      const visibleCategories = company.categories.filter(cat => !hiddenCategories.has(cat));
      if (!visibleCategories.length) return;

      if (visibleCategories.length === 1) {
        const catPos = categoryPositions[visibleCategories[0]];
        if (!catPos) return;

        // Distribution radiale autour du centre de la catégorie
        const pos = findAvailablePosition(catPos.x, catPos.y, 30, catPos.angle);
        
        companyPositions[company.id] = {
          x: pos.x,
          y: pos.y,
          categories: visibleCategories,
          color: catPos.color
        };
        return;
      }

      // Pour les entreprises multi-catégories
      const validCategories = visibleCategories.filter(cat => categoryPositions[cat]);
      if (!validCategories.length) return;

      const avgX = validCategories.reduce((sum, cat) => sum + categoryPositions[cat].x, 0) / validCategories.length;
      const avgY = validCategories.reduce((sum, cat) => sum + categoryPositions[cat].y, 0) / validCategories.length;
      
      // Trouver une position libre près de l'intersection
      const avgAngle = Math.atan2(avgY - centerY, avgX - centerX);
      const pos = findAvailablePosition(avgX, avgY, 0, avgAngle);

      companyPositions[company.id] = {
        x: pos.x,
        y: pos.y,
        categories: validCategories,
        color: categoryPositions[validCategories[0]].color
      };
    });

    // Calculer les formes organiques pour chaque catégorie
    const categoryShapes = {};
    Object.entries(categoryPositions).forEach(([category, pos]) => {
      const companiesInCategory = Object.entries(companyPositions)
        .filter(([_, cPos]) => cPos.categories.includes(category))
        .map(([_, cPos]) => ({ x: cPos.x, y: cPos.y }));

      if (companiesInCategory.length === 0) return;

      // Ajouter des points supplémentaires pour créer une forme plus large
      const expandedPoints = [];
      const expansionRadius = 100;
      const centerExpansionRadius = 180;
      const numPoints = 6; // Encore réduit pour plus de simplicité

      // Ajouter des points autour du centre de la catégorie
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        expandedPoints.push({
          x: pos.x + Math.cos(angle) * centerExpansionRadius,
          y: pos.y + Math.sin(angle) * centerExpansionRadius
        });
      }

      // Ajouter des points autour de chaque logo
      companiesInCategory.forEach(company => {
        const baseAngleOffset = Math.atan2(company.y - pos.y, company.x - pos.x);
        const distanceFromCenter = Math.sqrt(
          Math.pow(company.x - pos.x, 2) + Math.pow(company.y - pos.y, 2)
        );
        
        // Moins de points pour une forme plus simple
        const localNumPoints = Math.max(3, Math.floor(6 * distanceFromCenter / centerExpansionRadius));
        
        for (let i = 0; i < localNumPoints; i++) {
          const angle = baseAngleOffset + (i / localNumPoints) * 2 * Math.PI;
          const radiusScale = Math.max(0.7, 1 - distanceFromCenter / (centerExpansionRadius * 2));
          expandedPoints.push({
            x: company.x + Math.cos(angle) * expansionRadius * radiusScale,
            y: company.y + Math.sin(angle) * expansionRadius * radiusScale
          });
        }
      });

      // Ajouter les points originaux
      expandedPoints.push(...companiesInCategory);
      expandedPoints.push({ x: pos.x, y: pos.y });

      // Créer une forme englobante avec les points expandés
      let hull = d3.polygonHull(expandedPoints.map(p => [p.x, p.y]));
      if (!hull) return;

      // Simplifier le hull en supprimant les points trop proches ou créant des angles trop aigus
      const simplifiedHull = [];
      const minDistance = 40; // Distance minimale augmentée
      const minAngle = Math.PI / 6; // Angle minimal (30 degrés)
      
      const getAngle = (p1, p2, p3) => {
        const v1 = { x: p2[0] - p1[0], y: p2[1] - p1[1] };
        const v2 = { x: p3[0] - p2[0], y: p3[1] - p2[1] };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const cross = v1.x * v2.y - v1.y * v2.x;
        return Math.atan2(cross, dot);
      };
      
      hull.forEach((point, i) => {
        const prev = hull[(i - 1 + hull.length) % hull.length];
        const next = hull[(i + 1) % hull.length];
        
        // Vérifier la distance avec le point précédent
        const distance = Math.sqrt(
          Math.pow(point[0] - prev[0], 2) + 
          Math.pow(point[1] - prev[1], 2)
        );
        
        // Vérifier l'angle formé avec les points adjacents
        const angle = Math.abs(getAngle(prev, point, next));
        
        if (distance > minDistance && angle > minAngle) {
          simplifiedHull.push(point);
        }
      });

      // S'assurer qu'il y a au moins 4 points pour former une forme
      while (simplifiedHull.length < 4) {
        simplifiedHull.push(hull[simplifiedHull.length]);
      }

      // Convertir en courbe douce
      const curve = simplifiedHull.map(([x, y]) => ({ x, y }));
      
      // Calculer le centroid
      const centroid = {
        x: d3.mean(curve, d => d.x),
        y: d3.mean(curve, d => d.y)
      };

      // Créer une courbe plus fluide
      const smoothCurve = curve.map((point, i) => {
        const prev = curve[(i - 1 + curve.length) % curve.length];
        const next = curve[(i + 1) % curve.length];
        
        // Calculer la direction moyenne
        const dx = (next.x - prev.x) / 2;
        const dy = (next.y - prev.y) / 2;
        
        // Tension très faible pour des courbes plus douces
        const tension = 0.15;
        
        return {
          x: point.x,
          y: point.y,
          cp1x: point.x - dx * tension,
          cp1y: point.y - dy * tension,
          cp2x: point.x + dx * tension,
          cp2y: point.y + dy * tension
        };
      });

      categoryShapes[category] = {
        points: smoothCurve,
        centroid
      };
    });

    return { categoryPositions, companyPositions, categoryShapes };
  };

  const addWatermark = (ctx, width, height) => {
    const text = "MapMaker";
    ctx.save();
    
    // Configuration du filigrane
    ctx.globalAlpha = 0.15;
    ctx.font = '48px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Rotation du texte
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 4);
    
    // Ajout du texte
    ctx.fillText(text, 0, 0);
    
    // Restauration du contexte
    ctx.restore();
  };

  const renderVennDiagram = () => {
    const layout = calculateLayout();
    if (!layout) return null;

    const { categoryPositions, companyPositions, categoryShapes } = layout;

    return (
      <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
        {/* Dessiner les zones de catégories */}
        {Object.entries(categoryShapes).map(([category, shape]) => {
          const pos = categoryPositions[category];

          // Utiliser une courbe de Bézier quadratique pour plus de fluidité
          const pathCommands = shape.points.map((point, i, points) => {
            if (i === 0) return `M ${point.x},${point.y}`;
            
            const prev = points[i - 1];
            const cpx = (prev.cp2x + point.cp1x) / 2;
            const cpy = (prev.cp2y + point.cp1y) / 2;
            
            return `Q ${cpx},${cpy} ${point.x},${point.y}`;
          });

          return (
            <g key={category}>
              <path
                d={pathCommands.join(' ') + ' Z'}
                fill={pos.color}
                fillOpacity={0.12}
                stroke={pos.color}
                strokeWidth={2}
                filter="url(#glow)"
                style={{
                  transition: 'all 0.3s ease-in-out',
                  strokeLinejoin: 'round',
                  strokeLinecap: 'round'
                }}
              />
              <text
                x={shape.centroid.x}
                y={shape.centroid.y - 20}
                textAnchor="middle"
                className="font-bold text-xl"
                fill={pos.color}
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {category}
              </text>
            </g>
          );
        })}

        {/* Dessiner les entreprises */}
        {Object.entries(companyPositions).map(([id, pos]) => {
          const company = companies.find(c => c.id === id);
          if (!company) return null;

          const defaultLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.nom)}&background=random`;
          const logoSize = 50;
          const radius = logoSize / 2;

          return (
            <g 
              key={id} 
              className="company-node group"
              transform={`translate(${pos.x - radius}, ${pos.y - radius})`}
            >
              {/* Cercle de fond avec ombre */}
              <circle
                cx={radius}
                cy={radius}
                r={radius}
                fill="white"
                stroke={pos.color}
                strokeWidth="2"
                filter="url(#glow)"
              />

              <svg width={logoSize} height={logoSize}>
                <defs>
                  <pattern
                    id={`company-logo-${id}`}
                    patternUnits="objectBoundingBox"
                    width="1"
                    height="1"
                  >
                    <image
                      xlinkHref={company.logo_url || defaultLogoUrl}
                      width={logoSize}
                      height={logoSize}
                      preserveAspectRatio="xMidYMid slice"
                      onError={() => {
                        const pattern = document.getElementById(`company-logo-${id}`);
                        if (pattern) {
                          const image = pattern.querySelector('image');
                          if (image) {
                            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', defaultLogoUrl);
                          }
                        }
                      }}
                    />
                  </pattern>
                </defs>

                {/* Logo circulaire utilisant le pattern */}
                <circle
                  cx={radius}
                  cy={radius}
                  r={radius - 2}
                  fill={`url(#company-logo-${id})`}
                  className="transition-transform duration-200 ease-in-out transform group-hover:scale-110"
                />
              </svg>

              {/* Infobulle au survol */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Fond de l'infobulle */}
                <rect
                  x={-30}
                  y={logoSize + 10}
                  width={logoSize + 60}
                  height={30}
                  rx="5"
                  fill="white"
                  stroke={pos.color}
                  strokeWidth="1"
                  filter="url(#glow)"
                />
                
                {/* Triangle de l'infobulle */}
                <path
                  d={`M ${radius} ${logoSize} L ${radius - 8} ${logoSize + 10} L ${radius + 8} ${logoSize + 10} Z`}
                  fill="white"
                  stroke={pos.color}
                  strokeWidth="1"
                />

                {/* Texte de l'infobulle */}
                <text
                  x={radius}
                  y={logoSize + 30}
                  textAnchor="middle"
                  className="text-sm font-medium"
                  fill="#374151"
                >
                  {company.nom}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    );
  };

  const exportMappingAsImage = async (format) => {
    try {
      const svgElement = document.querySelector('#mapping-area svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Cloner le SVG pour ne pas modifier l'original
      const clonedSvg = svgElement.cloneNode(true);
      
      // Définir la taille du SVG
      const width = 1200;
      const height = 800;
      clonedSvg.setAttribute('width', width);
      clonedSvg.setAttribute('height', height);
      
      // Convertir les images en data URLs
      const images = clonedSvg.querySelectorAll('image');
      await Promise.all(Array.from(images).map(async (img) => {
        try {
          const imageUrl = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
          if (!imageUrl) return;

          const response = await fetch(imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          
          img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
        } catch (error) {
          console.error('Error converting image:', error);
        }
      }));

      // Convertir le SVG en string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      // Créer un Blob avec le SVG
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Créer une image à partir du SVG
      const img = new Image();
      img.src = svgUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Créer un canvas avec les dimensions souhaitées
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Fond blanc
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Dessiner l'image
      ctx.drawImage(img, 0, 0, width, height);

      // Ajouter le filigrane
      addWatermark(ctx, width, height);

      if (format === 'jpeg') {
        // Export JPEG
        const jpegUrl = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = jpegUrl;
        link.download = 'mapping.jpeg';
        link.click();
      } else if (format === 'pdf') {
        // Export PDF
        const imageData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Créer le PDF en format paysage A4
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Dimensions A4 paysage en mm
        const pdfWidth = 297;
        const pdfHeight = 210;

        // Calculer les dimensions de l'image pour qu'elle s'adapte à la page
        const imageAspectRatio = width / height;
        let imageWidth = pdfWidth;
        let imageHeight = pdfWidth / imageAspectRatio;

        if (imageHeight > pdfHeight) {
          imageHeight = pdfHeight;
          imageWidth = pdfHeight * imageAspectRatio;
        }

        // Centrer l'image
        const x = (pdfWidth - imageWidth) / 2;
        const y = (pdfHeight - imageHeight) / 2;

        // Ajouter l'image au PDF
        pdf.addImage(imageData, 'JPEG', x, y, imageWidth, imageHeight);
        pdf.save('mapping.pdf');
      }

      // Nettoyer
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      console.error('Export error:', error);
      alert('Une erreur est survenue lors de l\'export. Veuillez réessayer.');
    }
  };

  const handleUpdateCompany = async (editedCompany) => {
    try {
      const { error } = await supabase
        .from('entreprises')
        .update({
          nom: editedCompany.nom,
          description: editedCompany.description,
          logo_url: editedCompany.logo_url,
          categories: editedCompany.categories
        })
        .eq('id', editedCompany.id);

      if (error) throw error;

      // Mettre à jour les données localement
      setCompanies(companies.map(company => 
        company.id === editedCompany.id ? editedCompany : company
      ));

      // Fermer la modal
      setIsEditModalOpen(false);
      setSelectedCompany(null);

      return { error: null };
    } catch (error) {
      console.error('Error updating company:', error);
      return { error };
    }
  };

  const openEditModal = (company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div className="controls flex space-x-2">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`flex items-center px-3 py-2 rounded-md shadow text-sm font-medium transition-all ${
                hiddenCategories.has(category) ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                borderLeft: `4px solid ${colors(index)}`
              }}
            >
              {hiddenCategories.has(category) ? (
                <EyeSlashIcon className="w-5 h-5 mr-2" />
              ) : (
                <EyeIcon className="w-5 h-5 mr-2" />
              )}
              {category}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => exportMappingAsImage('jpeg')} 
            className="bg-yellow-400 text-white px-4 py-2 rounded shadow hover:bg-yellow-500 transition"
          >
            Export JPEG
          </button>
          <button 
            onClick={() => exportMappingAsImage('pdf')} 
            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center mt-10">
        <div 
          className="venn-container bg-white rounded-lg shadow-lg p-4 overflow-hidden relative"
          style={{ 
            width: '100%',
            height: 'calc(100vh - 150px)',
            margin: '0 auto'
          }}
          id="mapping-area"
        >
          <svg 
            width="100%"
            height="100%"
            viewBox="0 0 1200 800"
            className="w-full h-full"
            style={{ 
              border: '1px solid #eee',
              background: 'white',
              borderRadius: '12px'
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {renderVennDiagram()}
          </svg>

          {/* Contrôles de zoom et de déplacement */}
          <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
            <button 
              onClick={handleZoomIn}
              className="bg-green-500 text-white px-2 py-1 rounded shadow hover:bg-green-600 transition"
            >
              +
            </button>
            <button 
              onClick={handleZoomOut}
              className="bg-green-500 text-white px-2 py-1 rounded shadow hover:bg-green-600 transition"
            >
              -
            </button>
            <button 
              onClick={() => handleMove('up')}
              className="bg-gray-300 text-gray-700 px-2 py-1 rounded shadow hover:bg-gray-400 transition"
            >
              ↑
            </button>
            <button 
              onClick={() => handleMove('down')}
              className="bg-gray-300 text-gray-700 px-2 py-1 rounded shadow hover:bg-gray-400 transition"
            >
              ↓
            </button>
            <button 
              onClick={() => handleMove('left')}
              className="bg-gray-300 text-gray-700 px-2 py-1 rounded shadow hover:bg-gray-400 transition"
            >
              ←
            </button>
            <button 
              onClick={() => handleMove('right')}
              className="bg-gray-300 text-gray-700 px-2 py-1 rounded shadow hover:bg-gray-400 transition"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      <EditEntrepriseModal
        entreprise={selectedCompany}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCompany(null);
        }}
        onSave={handleUpdateCompany}
        onUpdate={(updatedCompany) => {
          setCompanies(companies.map(company => 
            company.id === updatedCompany.id ? updatedCompany : company
          ));
        }}
        categories={categories}
      />
    </div>
  );
};

export default VisualMapping;
