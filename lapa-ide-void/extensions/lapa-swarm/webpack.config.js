/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/ui/webview-entry.tsx',
	target: 'web',
	mode: 'production',
	output: {
		path: path.resolve(__dirname, 'media'),
		filename: 'main.js',
		clean: false,
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'esbuild-loader',
				options: {
					loader: 'tsx',
					target: 'es2020',
				},
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/ui/webview-template.html',
			filename: 'webview.html',
			inject: false, // We'll manually inject the script
		}),
	],
	// No externals needed - webview runs in browser context, not Node
	// vscode API is injected at runtime via acquireVsCodeApi()
};

