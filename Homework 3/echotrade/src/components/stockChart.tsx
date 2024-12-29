"use client";

import { useEffect, useRef } from "react";
import { stockhistory } from "@prisma/client";
import Chart from "chart.js/auto";

export default function StockChart({
  stockHistory
}: {
  stockHistory: stockhistory[]
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
    if (!chartRef.current || !stockHistory.length) return;

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
        labels: stockHistory.map(h => new Date(h.date).toLocaleDateString()),
        datasets: [
          {
            label: " Last Trade Price",
            data: stockHistory.map(h => parseFloat(h.last_trade_price.replace(/[.]/g, ""))),
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
          },
          {
            label: " Highest Price",
            data: stockHistory.map(h => parseFloat(h.max_price.replace(/[.]/g, ""))),
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1.5,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: 'rgb(34, 197, 94)',
            pointHoverBackgroundColor: 'rgb(34, 197, 94)',
          },
          {
            label: " Lowest Price",
            data: stockHistory.map(h => parseFloat(h.min_price.replace(/[.]/g, ""))),
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1.5,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: 'rgb(239, 68, 68)',
            pointHoverBackgroundColor: 'rgb(239, 68, 68)',
          },
          {
            label: " Average Price",
            data: stockHistory.map(h => parseFloat(h.avg_price.replace(/[.]/g, ""))),
            borderColor: 'rgb(234, 179, 8)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: 'rgb(234, 179, 8)',
            pointHoverBackgroundColor: 'rgb(234, 179, 8)',
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
  }, [stockHistory]);

  return (
    stockHistory.length > 0 ? (
      <div className="market-data-chart h-[600px] w-full relative">
        <canvas ref={chartRef}></canvas>
      </div>
    ) : (
      <div className="market-data-chart h-[600px] w-full relative flex items-center justify-center">
        <p className="text-center text-zinc-400">No data available for this period</p>
      </div>
    )
  );  
}