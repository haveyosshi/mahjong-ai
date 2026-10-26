import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/mahjong-ai/',plugins:[react()],resolve:{alias:{'next/navigation':new URL('./navigation.ts',import.meta.url).pathname}},css:{postcss:{plugins:[]}}});
