"use client";

import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { lstm_predictions as LSTMPredictions } from "@prisma/client";

export default function LSTMChart({ predictions }: { predictions: LSTMPredictions[] }) {
  const t = useTranslations("LSTMChart");
  const locale = useLocale();

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>();

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
        labels: locale === "mk" ?
          predictions.map(p => new Date(p.prediction_date).toLocaleDateString("mk-MK").replace(" г.", ""))
          : predictions.map(p => new Date(p.prediction_date).toLocaleDateString()),
        datasets: [
          {
            label: ` ${t("predictedPrice")}`,
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
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += `${locale === "mk" ? context.parsed.y.toLocaleString("mk-MK") : context.parsed.y.toLocaleString()} ${t("currency")}`;
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
                return `${locale === "mk" ? value.toLocaleString("mk-MK") : value.toLocaleString()} ${t("currency")}`;
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
  }, [predictions, locale, t]);

  return (
    <div className="h-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
} 