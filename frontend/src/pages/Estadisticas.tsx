import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api';
import { FiBarChart2, FiMapPin, FiWind } from 'react-icons/fi';
import { format } from 'date-fns';

// Importar los nuevos componentes
import EstadisticasGeneral from '../components/estadisticas/EstadisticasGeneral';
import EstadisticasPorAire from '../components/estadisticas/EstadisticasPorAire';
import EstadisticasPorUbicacion from '../components/estadisticas/EstadisticasPorUbicacion';

// Registrar componentes de ChartJS (solo necesario una vez en la aplicación, usualmente en App.tsx o index.tsx, pero aquí está bien por ahora)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Interfaces (Exportarlas para que los componentes hijos puedan importarlas) ---
export interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

export interface Lectura {
  id: number;
  aire_id: number;
  fecha: string; // Assuming ISO string format from backend
  temperatura: number;
  humedad: number;
}

export interface EstadisticasGenerales {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  total_lecturas: number;
  variacion_temperatura?: number; // Opcional si no viene del backend general
  variacion_humedad?: number;   // Opcional si no viene del backend general
}

export interface EstadisticasAire extends EstadisticasGenerales {
  aire_id: number;
  nombre: string;
  ubicacion: string;
  variacion_temperatura: number; // Asumiendo que el backend sí lo provee por aire
  variacion_humedad: number;   // Asumiendo que el backend sí lo provee por aire
}

export interface EstadisticasUbicacion {
  ubicacion: string;
  aires: number;
  temperatura_promedio: number;
  humedad_promedio: number;
}

export interface ChartDataType {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }[];
}

export interface UmbralConfiguracion {
  id: number;
  nombre: string;
  es_global: boolean;
  aire_id?: number | null; // Nullable si es global
  temp_min: number;
  temp_max: number;
  hum_min: number;
  hum_max: number;
  notificar_activo: boolean;
  // Puedes añadir aire_nombre, ubicacion si vienen del backend
}


// --- Componente Estadisticas (Contenedor) ---
const Estadisticas: React.FC = () => {
  // --- State (Mantenido en el componente padre) ---
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [aireSeleccionado, setAireSeleccionado] = useState<number | null>(null);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | null>(null);

  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasAire, setEstadisticasAire] = useState<EstadisticasAire | null>(null);
  const [estadisticasUbicacion, setEstadisticasUbicacion] = useState<EstadisticasUbicacion[]>([]);

  // State for chart data
  const [graficoGeneralTemp, setGraficoGeneralTemp] = useState<ChartDataType | null>(null);
  const [graficoGeneralHum, setGraficoGeneralHum] = useState<ChartDataType | null>(null);
  const [graficoComparativoTemp, setGraficoComparativoTemp] = useState<ChartDataType | null>(null);
  const [graficoComparativoHum, setGraficoComparativoHum] = useState<ChartDataType | null>(null);
  const [graficoAireTemp, setGraficoAireTemp] = useState<ChartDataType | null>(null);
  const [graficoAireHum, setGraficoAireHum] = useState<ChartDataType | null>(null);

  // Loading and Error States
  const [loadingGeneral, setLoadingGeneral] = useState<boolean>(true); // Para aires y stats generales iniciales
  const [loadingAire, setLoadingAire] = useState<boolean>(false); // Solo para datos específicos del aire
  const [loadingUbicacion, setLoadingUbicacion] = useState<boolean>(true); // Para stats de ubicación iniciales
  const [loadingChartsGeneral, setLoadingChartsGeneral] = useState<boolean>(true); // Para gráficos generales y comparativos
  const [loadingChartsAire, setLoadingChartsAire] = useState<boolean>(false); // Solo para gráficos específicos del aire
  const [error, setError] = useState<string | null>(null);

  const [umbrales, setUmbrales] = useState<UmbralConfiguracion[]>([]); // Estado para guardar umbrales
  const [loadingUmbrales, setLoadingUmbrales] = useState<boolean>(true); // Estado de carga para umbrales



  // --- Helper Functions (Mantenidas en el padre para procesar datos antes de pasarlos) ---
  const procesarLecturasParaGrafico = useCallback((
    lecturas: Lectura[],
    umbralesAplicables: UmbralConfiguracion[] // <-- Aceptar umbrales
  ): { tempChart: ChartDataType, humChart: ChartDataType } | null => {
    if (!lecturas || lecturas.length === 0) {
      return null;
    }
    // Ordenar y limitar lecturas (como antes)
    const sortedLecturas = [...lecturas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const limitedLecturas = sortedLecturas.slice(-50);

    const labels = limitedLecturas.map(l => format(new Date(l.fecha), 'HH:mm'));
    const tempData = limitedLecturas.map(l => l.temperatura);
    const humData = limitedLecturas.map(l => l.humedad);

    // --- Lógica para añadir datasets de umbrales ---
    // Encontrar los límites más restrictivos si hay múltiples umbrales aplicables
    // (Podrías hacer esto más sofisticado, aquí tomamos el primero encontrado activo)
    const tempMinThreshold = umbralesAplicables.find(u => u.temp_min !== undefined)?.temp_min;
    const tempMaxThreshold = umbralesAplicables.find(u => u.temp_max !== undefined)?.temp_max;
    const humMinThreshold = umbralesAplicables.find(u => u.hum_min !== undefined)?.hum_min;
    const humMaxThreshold = umbralesAplicables.find(u => u.hum_max !== undefined)?.hum_max;

    // Función helper para crear un dataset de umbral (línea horizontal)
    const createThresholdDataset = (label: string, value: number | undefined, color: string, dataLength: number) => {
      if (value === undefined || dataLength === 0) return null; // No añadir si no hay valor o datos
      return {
        label: label,
        data: Array(dataLength).fill(value), // Array con el mismo valor
        borderColor: color,
        borderWidth: 1.5, // Un poco más grueso
        borderDash: [5, 5], // Línea discontinua
        pointRadius: 0, // Sin puntos en la línea de umbral
        fill: false,
        tension: 0 // Línea recta
      };
    };

    // Crear datasets para Temperatura (incluyendo umbrales si existen)
    const tempDatasets = [
      { label: 'Temperatura °C', data: tempData, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.1 },
      createThresholdDataset('Temp Mín', tempMinThreshold, 'rgba(255, 159, 64, 0.8)', labels.length), // Naranja discontinuo
      createThresholdDataset('Temp Máx', tempMaxThreshold, 'rgba(255, 0, 0, 0.8)', labels.length)      // Rojo discontinuo
    ].filter(ds => ds !== null) as ChartDataType['datasets']; // Filtrar nulls y asegurar tipo

    // Crear datasets para Humedad (incluyendo umbrales si existen)
    const humDatasets = [
       { label: 'Humedad %', data: humData, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1 },
       createThresholdDataset('Hum Mín', humMinThreshold, 'rgba(75, 192, 192, 0.8)', labels.length), // Verde azulado discontinuo
       createThresholdDataset('Hum Máx', humMaxThreshold, 'rgba(153, 102, 255, 0.8)', labels.length) // Púrpura discontinuo
    ].filter(ds => ds !== null) as ChartDataType['datasets'];

    // Construir objetos de gráfico
    const tempChart: ChartDataType = { labels, datasets: tempDatasets };
    const humChart: ChartDataType = { labels, datasets: humDatasets };

    return { tempChart, humChart };
  }, []);
  const procesarUbicacionesParaGrafico = useCallback((stats: EstadisticasUbicacion[]): { tempChart: ChartDataType, humChart: ChartDataType } | null => {
    if (!stats || stats.length === 0) {
      return null;
    }
    const labels = stats.map(s => s.ubicacion);
    const tempAvgData = stats.map(s => s.temperatura_promedio);
    const humAvgData = stats.map(s => s.humedad_promedio);

    const tempChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Temperatura Promedio °C',
        data: tempAvgData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      }]
    };
    const humChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Humedad Promedio %',
        data: humAvgData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      }]
    };
    return { tempChart, humChart };
  }, []);

  // --- Effects (Mantenidos en el padre para fetching) ---

  // Initial Load
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      setLoadingGeneral(true);
      setLoadingUbicacion(true);
      setLoadingChartsGeneral(true);
      setLoadingUmbrales(true);
      setError(null);

      try {
        const [resAires, resEstGen, resEstUbic, resLecturasGen, resUmbrales] = await Promise.all([
          api.get('/aires'),
          api.get('/estadisticas/general'),
          api.get('/estadisticas/ubicacion'),
          api.get('/lecturas?limit=50'),
          api.get('/umbrales') 
        ]);

        // Aires y Ubicaciones
        const airesData = resAires.data?.data || resAires.data || [];
        setAires(airesData);
        const ubicacionesUnicas = Array.from(new Set(airesData.map((aire: AireAcondicionado) => aire.ubicacion)));
        setUbicaciones(ubicacionesUnicas as string[]);
        setLoadingGeneral(false); // Aires cargados

        // Stats Generales
        setEstadisticasGenerales(resEstGen.data || null);

        // Stats Ubicacion
        const ubicacionData = resEstUbic.data || [];
        setEstadisticasUbicacion(ubicacionData);
        setLoadingUbicacion(false); // Ubicaciones cargadas

        //Procesar Umbrales
        const umbralesData = resUmbrales.data?.data || []; // Asumiendo que la API devuelve { data: [...] }
        setUmbrales(umbralesData);
        setLoadingUmbrales(false); // Umbrales cargado

// Filtrar umbrales globales activos para el gráfico general
const umbralesGlobalesActivos = umbralesData.filter(
  (u: UmbralConfiguracion) => u.es_global && u.notificar_activo
);

        // Gráficos Generales (Línea)
        const lecturasGenerales = resLecturasGen.data?.data || [];
        const generalChartData = procesarLecturasParaGrafico(lecturasGenerales, umbralesGlobalesActivos); // Pasar los umbrales globales activos
        setGraficoGeneralTemp(generalChartData?.tempChart || null);
        setGraficoGeneralHum(generalChartData?.humChart || null);

        // Gráficos Comparativos (Barra)
        const comparativoChartData = procesarUbicacionesParaGrafico(ubicacionData);
        setGraficoComparativoTemp(comparativoChartData?.tempChart || null);
        setGraficoComparativoHum(comparativoChartData?.humChart || null);
        
        
      

        setLoadingChartsGeneral(false); // Gráficos generales cargados

        

      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar los datos iniciales de estadísticas.');
        setLoadingGeneral(false);
        setLoadingUbicacion(false);
        setLoadingChartsGeneral(false);
        setLoadingUmbrales(false);
      }
    };
    fetchDatosIniciales();
  }, [procesarLecturasParaGrafico, procesarUbicacionesParaGrafico]); // Incluir helpers si usan estado o props

  // Load Data for Selected Aire
  useEffect(() => {
    const fetchDatosAire = async () => {
      if (aireSeleccionado === null) {
        // Limpiar datos específicos del aire si no hay selección
        setEstadisticasAire(null);
        setGraficoAireTemp(null);
        setGraficoAireHum(null);
        return; // No continuar con la petición API
      }

      setLoadingAire(true);
      setLoadingChartsAire(true);
      setError(null);
      // ... (limpiar estados específicos del aire) ...

      try {
        const [resStatsAire, resLecturasAire] = await Promise.all([
          api.get(`/estadisticas/aire/${aireSeleccionado}`),
          api.get(`/lecturas?aire_id=${aireSeleccionado}&limit=50`) // O las últimas N
        ]);

        // ... (procesamiento de stats del aire) ...
        setLoadingAire(false);

        // --- Procesar Gráficos del Aire con Umbrales ---
        // Filtrar umbrales aplicables (globales activos + específico activo)
        const umbralesParaAire = umbrales.filter(u =>
            u.notificar_activo && (u.es_global || u.aire_id === aireSeleccionado)
        );

        const lecturasAireData = resLecturasAire.data?.data || [];
        const aireChartData = procesarLecturasParaGrafico(lecturasAireData, umbralesParaAire); // Pasar umbrales filtrados
        setGraficoAireTemp(aireChartData?.tempChart || null);
        setGraficoAireHum(aireChartData?.humChart || null);
        setLoadingChartsAire(false);

      } catch (err) {
        // ... (manejo de errores) ...
        setLoadingAire(false);
        setLoadingChartsAire(false);
      }
    };
    // Solo ejecutar si los umbrales ya se cargaron para evitar errores
    if (!loadingUmbrales) {
        fetchDatosAire();
    }
  // Añadir 'umbrales' y 'loadingUmbrales' a las dependencias
  }, [aireSeleccionado, aires, procesarLecturasParaGrafico, umbrales, loadingUmbrales]);

  // --- JSX (Simplificado usando los componentes hijos) ---
  return (
    <div>
      <h1 className="mb-4">Estadísticas</h1>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Indicador de carga principal */}
      {loadingGeneral && loadingUbicacion && (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos iniciales...</p>
        </div>
      )}

      {/* Mostrar Tabs solo después de la carga inicial */}
      {!loadingGeneral && !loadingUbicacion && (
        <Tabs defaultActiveKey="general" id="stats-tabs" className="mb-4" mountOnEnter>
          {/* Pestaña General */}
          <Tab eventKey="general" title={<><FiBarChart2 className="me-2" /> General</>}>
            <EstadisticasGeneral
              estadisticasGenerales={estadisticasGenerales}
              graficoGeneralTemp={graficoGeneralTemp}
              graficoGeneralHum={graficoGeneralHum}
              graficoComparativoTemp={graficoComparativoTemp}
              graficoComparativoHum={graficoComparativoHum}
              loadingGeneral={loadingGeneral} // Para el resumen card
              loadingChartsGeneral={loadingChartsGeneral} // Para los gráficos de línea generales
              loadingUbicacion={loadingUbicacion} // Para los gráficos de barra comparativos
            />
          </Tab>

          {/* Pestaña Por Aire */}
          <Tab eventKey="aire" title={<><FiWind className="me-2" /> Por Aire</>}>
            <EstadisticasPorAire
              aires={aires}
              aireSeleccionado={aireSeleccionado}
              setAireSeleccionado={setAireSeleccionado} // Pasar la función para actualizar el estado
              estadisticasAire={estadisticasAire}
              graficoAireTemp={graficoAireTemp}
              graficoAireHum={graficoAireHum}
              loadingGeneral={loadingGeneral} // Para deshabilitar el select mientras cargan los aires
              loadingAire={loadingAire} // Para mostrar spinner mientras cargan datos del aire
              loadingChartsAire={loadingChartsAire} // Para los gráficos del aire
            />
          </Tab>

          {/* Pestaña Por Ubicación */}
          <Tab eventKey="ubicacion" title={<><FiMapPin className="me-2" /> Por Ubicación</>}>
            <EstadisticasPorUbicacion
              ubicaciones={ubicaciones}
              ubicacionSeleccionada={ubicacionSeleccionada}
              setUbicacionSeleccionada={setUbicacionSeleccionada} // Pasar la función para actualizar el estado
              estadisticasUbicacion={estadisticasUbicacion}
              loadingUbicacion={loadingUbicacion} // Para la tabla y el select
            />
          </Tab>
        </Tabs>
      )}
    </div>
  );
};

export default Estadisticas;
