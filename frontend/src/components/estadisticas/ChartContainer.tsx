import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import { ChartDataType } from '../../pages/Estadisticas'; // Import the ChartDataType interface
import {
  ChartOptions,
  // Import ChartJS types if needed for ScriptableContext, though often inferred correctly
} from 'chart.js';

interface ChartContainerProps {
  title: string;
  yAxisLabel: string;
  data: ChartDataType | null;
  loading: boolean;
  type: 'line' | 'bar';
}

// Base options remain the same
const opcionesLineaBase: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true } // Title text will be added dynamically
    },
    scales: {
      y: {
        title: { display: true } // Y-axis label text will be added dynamically
      },
      x: {
        title: { display: true, text: 'Hora (HH:mm)' }
      }
    }
  };

const opcionesBarraBase: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true } // Title text will be added dynamically
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true } // Y-axis label text will be added dynamically
      },
      x: {
         title: { display: true, text: 'Ubicación' }
      }
    }
  };

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  yAxisLabel,
  data,
  loading,
  type
}) => {

  // No single 'options' variable here. Define them conditionally below.

  return (
    <Card className="dashboard-card">
      <Card.Header>{title}</Card.Header>
      <Card.Body>
         <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
          {loading ? (
            <div className="text-center p-5">
               <Spinner animation="border" size="sm" /> Cargando gráfico...
            </div>
          ) : data ? (
             type === 'line' ? (
                // Define options specifically for the Line chart here
                (() => {
                  const finalLineOptions: ChartOptions<'line'> = {
                    ...opcionesLineaBase,
                    plugins: {
                      ...opcionesLineaBase.plugins,
                      // Safely merge title options
                      title: {
                        ...opcionesLineaBase.plugins?.title,
                        display: true,
                        text: title
                      }
                    },
                    scales: {
                      ...opcionesLineaBase.scales,
                      // Safely merge y-axis options
                      y: {
                        ...opcionesLineaBase.scales?.y,
                        title: {
                          ...opcionesLineaBase.scales?.y?.title,
                          display: true,
                          text: yAxisLabel
                        }
                      }
                    }
                  };
                  return <Line data={data} options={finalLineOptions} />;
                })() // Immediately invoke the function
             ) : ( // type === 'bar'
                // Define options specifically for the Bar chart here
                (() => {
                  const finalBarOptions: ChartOptions<'bar'> = {
                    ...opcionesBarraBase,
                    plugins: {
                      ...opcionesBarraBase.plugins,
                      // Safely merge title options
                      title: {
                        ...opcionesBarraBase.plugins?.title,
                        display: true,
                        text: title
                      }
                    },
                    scales: {
                      ...opcionesBarraBase.scales,
                      // Safely merge y-axis options
                      y: {
                        ...opcionesBarraBase.scales?.y,
                        title: {
                          ...opcionesBarraBase.scales?.y?.title,
                          display: true,
                          text: yAxisLabel
                        }
                      }
                    }
                  };
                  return <Bar data={data} options={finalBarOptions} />;
                })() // Immediately invoke the function
             )
          ) : (
             <div className="text-center p-5 text-muted">No hay datos suficientes para generar el gráfico.</div>
          )}
         </div>
      </Card.Body>
    </Card>
  );
};

export default ChartContainer;
