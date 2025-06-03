declare module 'react-native-chart-kit' {
  import { ViewStyle } from 'react-native';
  
  interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    color?: (opacity?: number) => string;
    strokeWidth?: number;
    barPercentage?: number;
    useShadowColorFromDataset?: boolean;
  }

  interface ChartData {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity?: number) => string;
      strokeWidth?: number;
    }>;
  }

  interface PieChartData {
    name: string;
    amount: number;
    color: string;
    legendFontColor?: string;
    legendFontSize?: number;
  }

  interface LineChartProps {
    data: ChartData;
    width: number;
    height: number;
    chartConfig: ChartConfig;
    bezier?: boolean;
    style?: ViewStyle;
  }

  interface PieChartProps {
    data: PieChartData[];
    width: number;
    height: number;
    chartConfig: ChartConfig;
    accessor: string;
    backgroundColor?: string;
    paddingLeft?: string;
    style?: ViewStyle;
  }

  export class LineChart extends React.Component<LineChartProps> {}
  export class PieChart extends React.Component<PieChartProps> {}
} 