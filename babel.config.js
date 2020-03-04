module.exports = {
  presets: [
    [
      "@babel/env",
      {
        useBuiltIns: "entry",
        corejs: 3,
        targets: {
          browsers: ["last 2 versions", "safari >= 7"]
        }
      }
    ]
  ],
  env: {
    test: {
      presets: [
        [
          "@babel/env",
          {
            useBuiltIns: "entry",
            targets: {
              node: "current"
            },
            corejs: 3
          }
        ]
      ]
    }
  }
};
