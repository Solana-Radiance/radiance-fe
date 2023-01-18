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
    ChartDataset,
  } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState, useEffect, useMemo } from 'react';

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
type MultiBarGraphProps = {
    title: string;
    dates: string[];
    data: {
        [label: string]: number[];
    };
    colors?: string[];
}


export const MultiBarGraph = (props: MultiBarGraphProps) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 900);
    }, []);

    const colors = useMemo(() => {
        return props.colors ?? [
            '#c8bffd',
            '#ac9ffc',
            '#917ffb',
            '#7660fb', 
        ];
    }, [props]); 

    const datasets = useMemo(() => {
        let newDatasets: ChartDataset<"bar", number[]>[] = [];
        let { data } = props;

        let colorIndex = 0;
        let maxColorIndex = colors.length - 1;

        for(const [label, values] of Object.entries(data)) {

            newDatasets.push({
                label,
                data: values,
                backgroundColor: colors[colorIndex],
                borderColor: colors[colorIndex],
                //pointBackgroundColor: "transparent",
            })

            if(++colorIndex > maxColorIndex) {
                colorIndex = 0;
            }
        }

        return newDatasets;
    }, [props]);
    

    return (
        <div className='mt-5'>
            <strong>{props.title}</strong>
            <Bar
                height={isMobile? 350 : undefined}
                
                data={{
                    labels: props.dates,
                    datasets,
                }}
                options={{
                    animation: false,
                    responsive: true,
                    color: 'white',
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                font: {
                                    size: isMobile? 8 : undefined,
                                },
                                boxWidth: isMobile? 20 : undefined,
                            },
                        },
                
                        tooltip: {
                            mode: "index",
                            intersect: false,
                            position: "nearest",
                        },
                    },
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                display: false,
                            },
                            ticks : {
                                font: {
                                    size: isMobile? 8 : undefined,
                                },
                                color: 'white',
                            }
                        },
                        y: {
                            stacked: true,
                            grid: {
                                display: false,
                            },
                            ticks : {
                                font: {
                                    size: isMobile? 8 : undefined,
                                },
                                color: 'white',
                            },
                        }
                    }
                }}

                redraw={true}
            />
        </div>
    )
}
