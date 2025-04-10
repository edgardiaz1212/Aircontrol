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

// Importar los componentes hijos
import EstadisticasGeneral from '../components/estadisticas/EstadisticasGeneral';
import EstadisticasPorAire from '../components/estadisticas/EstadisticasPorAire';
import EstadisticasPorUbicacion from '../components/estadisticas/EstadisticasPorUbicacion';

// Registrar componentes de ChartJS
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

// --- Interfaces (Exportadas para uso en componentes hijos) ---
export interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

export interface Lectura {
  id: number;
  aire_id: number;
  fecha: string; // Asumiendo formato ISO o compatible con new Date()
  temperatura: number;
  humedad: number;
}

// Interfaz para estadísticas generales (estructura plana)
export interface EstadisticasGenerales {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  total_lecturas: number;
  // Podrían añadirse desviaciones si el backend las provee
  temperatura_desviacion?: number;
  humedad_desviacion?: number;
}

// Interfaz para estadísticas por aire (estructura plana, hereda/extiende la general)
export interface EstadisticasAire extends EstadisticasGenerales {
  aire_id: number;
  nombre: string;
  ubicacion: string;
  variacion_temperatura: number; // Calculada en el frontend
  variacion_humedad: number;   // Calculada en el frontend
}

// Interfaz para estadísticas por ubicación
export interface EstadisticasUbicacion {
  ubicacion: string;
  num_aires: number; // Cambiado de 'aires' a 'num_aires' para claridad
  temperatura_promedio: number;
  temperatura_min: number;
  temperatura_max: number;
  temperatura_std: number;
  humedad_promedio: number;
  humedad_min: number;
  humedad_max: number;
  humedad_std: number;
  lecturas_totales: number;
}

// Interfaz para datos de gráficos
export interface ChartDataType {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[]; // Permitir null para datos faltantes
    borderColor?: string;
    backgroundColor?: string | string[]; // Permitir array para barras
    tension?: number;
    borderWidth?: number;
    borderDash?: number[];
    pointRadius?: number;
    fill?: boolean;
  }[];
}

// Interfaz para umbrales
export interface UmbralConfiguracion {
  id: number;
  nombre: string;
  es_global: boolean;
  aire_id?: number | null;
  temp_min: number;
  temp_max: number;
  hum_min: number;
  hum_max: number;
  notificar_activo: boolean;
  aire_nombre?: string;
  ubicacion?: string;
}


// --- Componente Estadisticas (Contenedor Principal) ---
const Estadisticas: React.FC = () => {
  // --- Estados ---
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [aireSeleccionado, setAireSeleccionado] = useState<number | null>(null);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | null>(null);

  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasAire, setEstadisticasAire] = useState<EstadisticasAire | null>(null);
  const [estadisticasUbicacion, setEstadisticasUbicacion] = useState<EstadisticasUbicacion[]>([]);

  const [graficoGeneralTemp, setGraficoGeneralTemp] = useState<ChartDataType | null>(null);
  const [graficoGeneralHum, setGraficoGeneralHum] = useState<ChartDataType | null>(null);
  const [graficoComparativoTemp, setGraficoComparativoTemp] = useState<ChartDataType | null>(null);
  const [graficoComparativoHum, setGraficoComparativoHum] = useState<ChartDataType | null>(null);
  const [graficoAireTemp, setGraficoAireTemp] = useState<ChartDataType | null>(null);
  const [graficoAireHum, setGraficoAireHum] = useState<ChartDataType | null>(null);

  const [loadingGeneral, setLoadingGeneral] = useState<boolean>(true);
  const [loadingAire, setLoadingAire] = useState<boolean>(false);
  const [loadingUbicacion, setLoadingUbicacion] = useState<boolean>(true);
  const [loadingChartsGeneral, setLoadingChartsGeneral] = useState<boolean>(true);
  const [loadingChartsAire, setLoadingChartsAire] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [umbrales, setUmbrales] = useState<UmbralConfiguracion[]>([]);
  const [loadingUmbrales, setLoadingUmbrales] = useState<boolean>(true);

  // --- Funciones Auxiliares para Procesar Datos ---

  // Procesa lecturas para gráficos de línea (temperatura y humedad)
  const procesarLecturasParaGrafico = useCallback((
    lecturas: Lectura[],
    umbralesAplicables: UmbralConfiguracion[]
  ): { tempChart: ChartDataType, humChart: ChartDataType } | null => {
    if (!lecturas || lecturas.length === 0) return null;

    const sortedLecturas = [...lecturas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const limitedLecturas = sortedLecturas.slice(-50); // Limitar a las últimas 50

    const labels = limitedLecturas.map(l => format(new Date(l.fecha), 'HH:mm'));
    const tempData = limitedLecturas.map(l => l.temperatura);
    const humData = limitedLecturas.map(l => l.humedad);

    // Encontrar umbrales más restrictivos (podría mejorarse si hay múltiples del mismo tipo)
    const tempMinThreshold = umbralesAplicables.find(u => u.temp_min !== undefined)?.temp_min;
    const tempMaxThreshold = umbralesAplicables.find(u => u.temp_max !== undefined)?.temp_max;
    const humMinThreshold = umbralesAplicables.find(u => u.hum_min !== undefined)?.hum_min;
    const humMaxThreshold = umbralesAplicables.find(u => u.hum_max !== undefined)?.hum_max;

    // Helper para crear datasets de umbrales
    const createThresholdDataset = (label: string, value: number | undefined, color: string, dataLength: number) => {
      if (value === undefined || dataLength === 0) return null;
      return {
        label: label,
        data: Array(dataLength).fill(value),
        borderColor: color,
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0
      };
    };

    // Datasets de Temperatura
    const tempDatasets = [
      { label: 'Temperatura °C', data: tempData, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.1 },
      createThresholdDataset('Temp Mín', tempMinThreshold, 'rgba(255, 159, 64, 0.8)', labels.length),
      createThresholdDataset('Temp Máx', tempMaxThreshold, 'rgba(255, 0, 0, 0.8)', labels.length)
    ].filter(ds => ds !== null) as ChartDataType['datasets'];

    // Datasets de Humedad
    const humDatasets = [
       { label: 'Humedad %', data: humData, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1 },
       createThresholdDataset('Hum Mín', humMinThreshold, 'rgba(75, 192, 192, 0.8)', labels.length),
       createThresholdDataset('Hum Máx', humMaxThreshold, 'rgba(153, 102, 255, 0.8)', labels.length)
    ].filter(ds => ds !== null) as ChartDataType['datasets'];

    return {
      tempChart: { labels, datasets: tempDatasets },
      humChart: { labels, datasets: humDatasets }
    };
  }, []); // Dependencias vacías si no usa estado/props externos

  // Procesa estadísticas por ubicación para gráficos de barras comparativos
  const procesarUbicacionesParaGrafico = useCallback((stats: EstadisticasUbicacion[]): { tempChart: ChartDataType, humChart: ChartDataType } | null => {
    if (!stats || stats.length === 0) return null;

    const labels = stats.map(s => s.ubicacion);
    const tempAvgData = stats.map(s => s.temperatura_promedio);
    const humAvgData = stats.map(s => s.humedad_promedio);

    // Colores para las barras (puedes definir más si tienes muchas ubicaciones)
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
    ];

    const tempChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Temperatura Promedio °C',
        data: tempAvgData,
        backgroundColor: backgroundColors.slice(0, labels.length) // Asigna colores
      }]
    };
    const humChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Humedad Promedio %',
        data: humAvgData,
        backgroundColor: backgroundColors.slice(0, labels.length).reverse() // Usa colores diferentes o en otro orden
      }]
    };
    return { tempChart, humChart };
  }, []); // Dependencias vacías

  // --- Efectos para Cargar Datos ---

  // Carga inicial de datos generales, aires, ubicaciones, umbrales y gráficos generales/comparativos
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      setLoadingGeneral(true);
      setLoadingUbicacion(true);
      setLoadingChartsGeneral(true);
      setLoadingUmbrales(true);
      setError(null);

      try {
        // Peticiones en paralelo
        const [resAires, resEstGen, resEstUbic, resLecturasGen, resUmbrales] = await Promise.all([
          api.get('/aires'),
          api.get('/estadisticas/general'),
          api.get('/estadisticas/ubicacion'),
          api.get('/lecturas?limit=50'), // Últimas 50 lecturas para gráfico general
          api.get('/umbrales')
        ]);

        // Procesar Aires y Ubicaciones
        const airesData = resAires.data?.data || resAires.data || [];
        setAires(airesData);
        const ubicacionesUnicas = Array.from(new Set(airesData.map((aire: AireAcondicionado) => aire.ubicacion)));
        setUbicaciones(ubicacionesUnicas as string[]);
        setLoadingGeneral(false);

        // Procesar Estadísticas Generales
        setEstadisticasGenerales(resEstGen.data || null);

        // Procesar Estadísticas por Ubicación
        const ubicacionData = resEstUbic.data || [];
        setEstadisticasUbicacion(ubicacionData);
        setLoadingUbicacion(false);

        // Procesar Umbrales
        const umbralesData = resUmbrales.data?.data || [];
        setUmbrales(umbralesData);
        setLoadingUmbrales(false);

        // Procesar Gráficos Generales (Línea)
        const umbralesGlobalesActivos = umbralesData.filter(
          (u: UmbralConfiguracion) => u.es_global && u.notificar_activo
        );
        const lecturasGenerales = resLecturasGen.data?.data || []; // Asegúrate que la API devuelve { data: [...] }
        const generalChartData = procesarLecturasParaGrafico(lecturasGenerales, umbralesGlobalesActivos);
        setGraficoGeneralTemp(generalChartData?.tempChart || null);
        setGraficoGeneralHum(generalChartData?.humChart || null);

        // Procesar Gráficos Comparativos (Barra)
        const comparativoChartData = procesarUbicacionesParaGrafico(ubicacionData);
        setGraficoComparativoTemp(comparativoChartData?.tempChart || null);
        setGraficoComparativoHum(comparativoChartData?.humChart || null);

        setLoadingChartsGeneral(false);

      } catch (err: any) {
        console.error('Error al cargar datos iniciales:', err);
        const message = err.response?.data?.mensaje || 'Error al cargar los datos iniciales de estadísticas.';
        setError(message);
        // Establecer estados de carga a false en caso de error
        setLoadingGeneral(false);
        setLoadingUbicacion(false);
        setLoadingChartsGeneral(false);
        setLoadingUmbrales(false);
      }
    };
    fetchDatosIniciales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procesarLecturasParaGrafico, procesarUbicacionesParaGrafico]); // Dependencias de useCallback

  // Carga de datos específicos cuando se selecciona un aire
  useEffect(() => {
    const fetchDatosAire = async () => {
      // Si no hay aire seleccionado, limpiar datos y salir
      if (aireSeleccionado === null) {
        setEstadisticasAire(null);
        setGraficoAireTemp(null);
        setGraficoAireHum(null);
        return;
      }

      // Indicar carga
      setLoadingAire(true);
      setLoadingChartsAire(true);
      setError(null);

      try {
        // Peticiones en paralelo para stats y lecturas del aire
        const [resStatsAire, resLecturasAire] = await Promise.all([
          api.get(`/estadisticas/aire/${aireSeleccionado}`),
          api.get(`/lecturas?aire_id=${aireSeleccionado}&limit=50`) // Últimas 50 lecturas para este aire
        ]);

        // Procesar Estadísticas del Aire
        const statsData = resStatsAire.data; // Asume estructura plana devuelta por el backend
        if (statsData) {
           const aireInfo = aires.find(a => a.id === aireSeleccionado);
           // Calcular variaciones en el frontend
           const variacionTemp = (statsData.temperatura_maxima !== undefined && statsData.temperatura_minima !== undefined)
                                 ? Math.abs(statsData.temperatura_maxima - statsData.temperatura_minima)
                                 : 0;
           const variacionHum = (statsData.humedad_maxima !== undefined && statsData.humedad_minima !== undefined)
                                ? Math.abs(statsData.humedad_maxima - statsData.humedad_minima)
                                : 0;

           const objetoParaEstado = {
        ...statsData,
        aire_id: aireSeleccionado,
        nombre: aireInfo?.nombre || 'Desconocido',
        ubicacion: aireInfo?.ubicacion || 'Desconocida',
        variacion_temperatura: parseFloat(variacionTemp.toFixed(2)),
        variacion_humedad: parseFloat(variacionHum.toFixed(2)),
    };

    setEstadisticasAire(objetoParaEstado);

  } else {
    setEstadisticasAire(null);
  }
  setLoadingAire(false)

        // Procesar Gráficos del Aire
        const umbralesParaAire = umbrales.filter(u =>
            u.notificar_activo && (u.es_global || u.aire_id === aireSeleccionado)
        );
        const lecturasAireData = resLecturasAire.data?.data || []; // Asegúrate que la API devuelve { data: [...] }
        const aireChartData = procesarLecturasParaGrafico(lecturasAireData, umbralesParaAire);
        setGraficoAireTemp(aireChartData?.tempChart || null);
        setGraficoAireHum(aireChartData?.humChart || null);
        setLoadingChartsAire(false); // Gráficos del aire cargados

      } catch (err: any) {
        console.error(`Error al cargar datos para el aire ${aireSeleccionado}:`, err);
        const message = err.response?.data?.mensaje || `Error al cargar datos para el aire seleccionado.`;
        setError(message);
        // Limpiar estados y carga en caso de error
        setEstadisticasAire(null);
        setGraficoAireTemp(null);
        setGraficoAireHum(null);
        setLoadingAire(false);
        setLoadingChartsAire(false);
      }
    };

    // Ejecutar solo si los umbrales y los aires ya se cargaron
    if (!loadingUmbrales && !loadingGeneral) {
        fetchDatosAire();
    }
  // Dependencias: se ejecuta cuando cambia el aire seleccionado o cuando se cargan los umbrales/aires iniciales
  }, [aireSeleccionado, aires, umbrales, loadingUmbrales, loadingGeneral, procesarLecturasParaGrafico]);

  // --- Renderizado ---
  return (
    <div>
      <h1 className="mb-4">Estadísticas</h1>

      {/* Mensaje de Error General */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Indicador de Carga Principal */}
      {(loadingGeneral || loadingUbicacion || loadingUmbrales) && (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos iniciales...</p>
        </div>
      )}

      {/* Contenido Principal (Tabs) - Mostrar solo después de carga inicial */}
      {!loadingGeneral && !loadingUbicacion && !loadingUmbrales && (
        <Tabs defaultActiveKey="general" id="stats-tabs" className="mb-4" mountOnEnter unmountOnExit>
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
              setAireSeleccionado={setAireSeleccionado} // Pasar la función para actualizar
              estadisticasAire={estadisticasAire}
              graficoAireTemp={graficoAireTemp}
              graficoAireHum={graficoAireHum}
              loadingGeneral={loadingGeneral} // Para deshabilitar select
              loadingAire={loadingAire} // Para spinner de stats del aire
              loadingChartsAire={loadingChartsAire} // Para spinner de gráficos del aire
            />
          </Tab>

          {/* Pestaña Por Ubicación */}
          <Tab eventKey="ubicacion" title={<><FiMapPin className="me-2" /> Por Ubicación</>}>
            <EstadisticasPorUbicacion
              ubicaciones={ubicaciones}
              ubicacionSeleccionada={ubicacionSeleccionada}
              setUbicacionSeleccionada={setUbicacionSeleccionada} // Pasar la función para actualizar
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
