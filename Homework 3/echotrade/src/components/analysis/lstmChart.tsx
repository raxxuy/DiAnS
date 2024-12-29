"use client";

import { useEffect, useRef } from "react";
import { LSTMPrediction } from "@/lib/predictions/lstm";
import Chart from "chart.js/auto";

export default function LSTMChart({
  predictions
}: {
  predictions: LSTMPrediction[]
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !predictions.length) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(75, 192, 192, 0.25)');
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0.02)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: predictions.map(p => new Date(p.prediction_date).toLocaleDateString()),
        datasets: [
          {
            label: " Predicted Price",
            data: predictions.map(p => parseFloat(p.predicted_price.toFixed(0))),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: gradient,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgb(75, 192, 192)',
            pointHoverBackgroundColor: 'rgb(75, 192, 192)',
            pointBorderColor: '#fff',
            pointHoverBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHitRadius: 6,
            cubicInterpolationMode: 'monotone'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#fff',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(17, 17, 17, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(75, 192, 192, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 600
            },
            bodyFont: {
              size: 13,
              weight: 400
            },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += `${context.parsed.y.toLocaleString()} MKD`;
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.06)',
              tickLength: 8,
              display: true
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              padding: 8,
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: 11,
                weight: 400
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.06)',
              display: true
            },
            beginAtZero: false,
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              padding: 12,
              font: {
                size: 11,
                weight: 400
              },
              callback: function(value) {
                return `${value.toLocaleString()} MKD`;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        hover: {
          mode: 'nearest',
          intersect: false
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    });

    window.dispatchEvent(new Event('resize'));
  }, [predictions]);

  return (
    <div className="h-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
} 