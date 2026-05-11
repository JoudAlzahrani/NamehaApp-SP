import React from 'react';
import { Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

export const BRAND_GRADIENT = ['#852EC6', '#7F80D8', '#76E3EF'];
export const GRAD_START = { x: 0, y: 0 };
export const GRAD_END = { x: 1, y: 0 };


interface GradientTextProps {
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export default function GradientText({ style, children }: GradientTextProps) {
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={BRAND_GRADIENT} start={GRAD_START} end={GRAD_END}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
