# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.1](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.3.0...@elux/cli-webpack@2.3.1) (2022-08-29)


### Bug Fixes

* webpack-dev-server新版本废弃了onBeforeSetupMiddleware ([4a13621](https://github.com/hiisea/elux/commit/4a13621e4c40d57c42b22f852825c7602656cd13))





# [2.3.0](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.2.2...@elux/cli-webpack@2.3.0) (2022-08-09)


### Features

* 升级webpack、webpack-dev-server到最新 ([8e113a2](https://github.com/hiisea/elux/commit/8e113a2685a0edea8c0e2de9bbe4a4f61aceeec9))





## [2.2.2](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.2.1...@elux/cli-webpack@2.2.2) (2022-07-27)


### Bug Fixes

* webpack热更新不太准确 ([c7e9ab7](https://github.com/hiisea/elux/commit/c7e9ab73d22064fcd1b94f6fa3d806e582b87e62))





## [2.2.1](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.2.0...@elux/cli-webpack@2.2.1) (2022-06-06)


### Bug Fixes

* 黑色终端背景下有的文字颜色看不清 ([c7273b3](https://github.com/hiisea/elux/commit/c7273b3c229550dc022d3b0490888be2e9bb701e))





# [2.2.0](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.1.2...@elux/cli-webpack@2.2.0) (2022-06-03)


### Bug Fixes

* 路由强制返回 ([132d133](https://github.com/hiisea/elux/commit/132d1333bd5574e044f674ef97983a1d1589f580))


### Features

* 将cli拆分为cli和cli-init ([ac69364](https://github.com/hiisea/elux/commit/ac69364c2e7dcb5a74f2fbd268a59a9bc79e8865))





## [2.1.2](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.1.1...@elux/cli-webpack@2.1.2) (2022-05-28)

**Note:** Version bump only for package @elux/cli-webpack





## [2.1.1](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.1.0...@elux/cli-webpack@2.1.1) (2022-05-28)

**Note:** Version bump only for package @elux/cli-webpack





# [2.1.0](https://github.com/hiisea/elux/compare/@elux/cli-webpack@2.0.0...@elux/cli-webpack@2.1.0) (2022-04-25)


### Bug Fixes

* 导出getCssScopedName ([8e518cf](https://github.com/hiisea/elux/commit/8e518cfeb543315768187e801ac9472ec2d7c78b))


### Features

* 优化交互体验 ([772fcf2](https://github.com/hiisea/elux/commit/772fcf21966a1d5bff6463921889fb2a7a03d8c6))





# [2.0.0](https://github.com/hiisea/elux/compare/@elux/cli-webpack@1.2.0...@elux/cli-webpack@2.0.0) (2022-04-11)


### Code Refactoring

* 重构创建项目向导 ([a56786c](https://github.com/hiisea/elux/commit/a56786c0447ed95e9f26d06b219d6c0858cff0a3))


### Features

* 版本升级 ([9744a36](https://github.com/hiisea/elux/commit/9744a365f06b64d09a6a5d46bf545f8309d77e83))
* ssr支持重定向 ([8cdbbe5](https://github.com/hiisea/elux/commit/8cdbbe51a632bf88c422c36960a920a1239d6f0b))


### BREAKING CHANGES

* 跟随@elux/core升级为v2





# [1.2.0](https://github.com/hiisea/elux/compare/@elux/cli-webpack@1.1.1...@elux/cli-webpack@1.2.0) (2022-02-13)


### Bug Fixes

* 清理SSR生成文件 ([e9ad4b1](https://github.com/hiisea/elux/commit/e9ad4b13a19be3c5296dbd2d5fe8f19f0e095694))
* prod模式下，出现lint错误终止webpack ([228ab1a](https://github.com/hiisea/elux/commit/228ab1ac7b3676328458575e8ba1ec9b187eb985))
* ssr server端splitChunck时异常 ([fbba2c2](https://github.com/hiisea/elux/commit/fbba2c277bc7031ebbc75bc289dcfbd87a09d05a))
* ssr时无法指定Node版本 ([9a484b2](https://github.com/hiisea/elux/commit/9a484b2eccda6573713cef0d0ba9b14a07f420a7))


### Features

* 增加webpack-bundle-analyzer预设 ([88a6d46](https://github.com/hiisea/elux/commit/88a6d46230698150988c16f7ae5abf080efa9151))
* 支持open-in-editor ([79ee435](https://github.com/hiisea/elux/commit/79ee435f490eb6220e413e27a6ae573af30b48f1))
* pack命名增加minimize参数 ([e860c20](https://github.com/hiisea/elux/commit/e860c2094d53ad935ab2f6cb2e6aa0cff25ad05c))





## [1.1.1](https://github.com/hiisea/elux/compare/@elux/cli-webpack@1.1.0...@elux/cli-webpack@1.1.1) (2022-01-08)

**Note:** Version bump only for package @elux/cli-webpack





# 1.1.0 (2021-12-13)



# 1.0.0 (2021-12-05)


### Bug Fixes

* bugs ([62d0b06](https://github.com/hiisea/elux/commit/62d0b06b1b2737841c9b3532140a42073a987cf4))


### Features

* mockserver端口占用检查 ([391ae5d](https://github.com/hiisea/elux/commit/391ae5da4a60c344e194f4aa660e6df3ff1b6578))


### Performance Improvements

* 编译vue时去除ts-loader ([2900fc4](https://github.com/hiisea/elux/commit/2900fc4852b14db4c42d2dab7a0ad85131a8477f))



## 0.1.48 (2021-11-28)


### Bug Fixes

* vue-loader版本 ([8d4939b](https://github.com/hiisea/elux/commit/8d4939b73fc2ab91a7366a000fb255364c968ca1))



## 0.1.47 (2021-11-27)


### Features

* 模板支持replace ([22b623c](https://github.com/hiisea/elux/commit/22b623c30cc91f8168fc6c7cfcd055809239afbb))
* 支持sass ([b67f6d5](https://github.com/hiisea/elux/commit/b67f6d525b4dc55658bb9bd917857be9d2d12650))



## 0.1.26 (2021-11-14)


### Features

* 基本完成 ([d68f9dc](https://github.com/hiisea/elux/commit/d68f9dc0947425158b9ca92e75b8588247945163))
