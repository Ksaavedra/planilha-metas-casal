const path = require('path');

module.exports = {
   entry: './src/lambda.ts',
   target: 'node',
   mode: 'production',
   externals: {
      'aws-sdk': 'aws-sdk',
   },
   module: {
      rules: [
         {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
         },
      ],
   },
   resolve: {
      extensions: ['.ts', '.js'],
   },
   output: {
      libraryTarget: 'commonjs2',
      path: path.resolve(__dirname, '.webpack'),
      filename: 'lambda.js',
   },
   optimization: {
      minimize: true,
   },
};
