import React from 'react';
import { Card, Row, Col, Spinner, Table } from 'react-bootstrap';
import { FiBarChart2, FiThermometer, FiDroplet, FiClock } from 'react-icons/fi';
import { ChartDataType } from '../../pages/Estadisticas'; // Import the ChartDataType interface
import ChartContainer from './ChartContainer';
import EstadisticasResumenCard from './EstadisticasResumenCard';

interface EstadisticasGenerales {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  total_lecturas: number;
}

interface EstadisticasGeneralProps {
  estadisticasGenerales: EstadisticasGenerales | null;
  graficoGeneralTemp: ChartDataType | null;
  graficoGeneralHum: ChartDataType | null;
  graficoComparativoTemp: ChartDataType | null;
  graficoComparativoHum: ChartDataType | null;
  loadingGeneral: boolean;
  loadingChartsGeneral: boolean;
  loadingUbicacion:boolean;
}

const EstadisticasGeneral: React.FC<EstadisticasGeneralProps> = ({
  estadisticasGenerales,
  graficoGeneralTemp,
  graficoGeneralHum,
  graficoComparativoTemp,
  graficoComparativoHum,
  loadingGeneral,
  loadingChartsGeneral,
  loadingUbicacion
}) => {
  return (
    <div>
      <Row>
        {/* Resumen General Card */}
        <Col lg={4} md={6} className="mb-4">
          <EstadisticasResumenCard estadisticas={estadisticasGenerales} loading={loadingGeneral} />
        </Col>
        {/* General Charts Column */}
        <Col lg={8} md={6} className="mb-4">
          <Row>
            <Col sm={12} className="mb-4">
              <ChartContainer
                title="Variación General de Temperatura (Últimas lecturas)"
                yAxisLabel="Temperatura (°C)"
                data={graficoGeneralTemp}
                loading={loadingChartsGeneral}
                type={'line'}
              />
            </Col>
            <Col sm={12}>
               <ChartContainer
                  title="Variación General de Humedad (Últimas lecturas)"
                  yAxisLabel="Humedad (%)"
                  data={graficoGeneralHum}
                  loading={loadingChartsGeneral}
                  type={'line'}
               />
            </Col>
          </Row>
        </Col>
      </Row>
      {/* Comparative Charts Row */}
      <Row>
        <Col md={6} className="mb-4">
          <ChartContainer
            title="Temperatura Promedio por Ubicación"
            yAxisLabel="Temperatura (°C)"
            data={graficoComparativoTemp}
            loading={loadingUbicacion}
            type={'bar'}
          />
        </Col>
        <Col md={6} className="mb-4">
           <ChartContainer
              title="Humedad Promedio por Ubicación"
              yAxisLabel="Humedad (%)"
              data={graficoComparativoHum}
              loading={loadingUbicacion}
              type={'bar'}
           />
        </Col>
      </Row>
    </div>
  );
};

export default EstadisticasGeneral;
