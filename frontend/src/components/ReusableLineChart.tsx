import { Text } from "@tremor/react";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    YAxisProps, TooltipProps
} from 'recharts';

// --- Component Props ---
interface ReusableLineChartProps {
    chartData: any[]; // Data array for the chart
    dataKey: string; // Key in chartData for the line
    strokeColor: string; // Color for the line
    chartTitle: string; // Title text above the chart
    yAxisProps?: YAxisProps; // Optional props to customize YAxis (e.g., domain, tickFormatter)
    tooltipFormatter?: TooltipProps<any, any>['formatter']; // Optional custom tooltip formatter
    showXAxis?: boolean; // Whether to show X-axis labels (default: false, show on last chart)
    lineType?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter"; // Optional line type
    yAxisWidth?: number;
}

// --- Reusable Component ---
function ReusableLineChart({
    chartData,
    dataKey,
    strokeColor,
    chartTitle,
    yAxisProps,
    tooltipFormatter,
    showXAxis = false,
    lineType = "monotone",
    yAxisWidth = 40,
}: ReusableLineChartProps) {

    // Default Y-axis props, can be overridden
    const defaultYAxisProps: YAxisProps = {
        domain: ['auto', 'auto'],
        fontSize: 11,
        tick: { fill: '#9ca3af' }, // Default tick color
        width: yAxisWidth,
        ...(yAxisProps || {}), // Merge with passed props
    };

    return (
        <>
            <Text className="font-medium mb-1">{chartTitle}</Text>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: showXAxis ? 5 : 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                    <XAxis
                        dataKey="time"
                        fontSize={11}
                        tick={{ fill: '#9ca3af' }}
                        hide={!showXAxis}
                        axisLine={showXAxis}
                        tickLine={showXAxis}
                    />
                    <YAxis {...defaultYAxisProps} />
                    <Tooltip
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                        labelStyle={{ color: '#1f2937' }}
                        formatter={tooltipFormatter} // Use the passed formatter
                    />
                    <Line
                        type={lineType}
                        dataKey={dataKey}
                        stroke={strokeColor}
                        strokeWidth={lineType === 'stepAfter' ? 2 : 2.5} // Adjust thickness if needed
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={700}
                        name={chartTitle} // Use title for tooltip name fallback
                    />
                </LineChart>
            </ResponsiveContainer>
        </>
    );
}

export default ReusableLineChart; 