"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/isows@1.0.6_ws@8.18.0";
exports.ids = ["vendor-chunks/isows@1.0.6_ws@8.18.0"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/index.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/index.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.WebSocket = void 0;\nconst WebSocket_ = __webpack_require__(/*! ws */ \"(ssr)/./node_modules/.pnpm/ws@8.18.0/node_modules/ws/index.js\");\nconst utils_js_1 = __webpack_require__(/*! ./utils.js */ \"(ssr)/./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/utils.js\");\nexports.WebSocket = (() => {\n    try {\n        return (0, utils_js_1.getNativeWebSocket)();\n    }\n    catch {\n        if (WebSocket_.WebSocket)\n            return WebSocket_.WebSocket;\n        return WebSocket_;\n    }\n})();\n//# sourceMappingURL=index.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vaXNvd3NAMS4wLjZfd3NAOC4xOC4wL25vZGVfbW9kdWxlcy9pc293cy9fY2pzL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGlCQUFpQjtBQUNqQixtQkFBbUIsbUJBQU8sQ0FBQyx5RUFBSTtBQUMvQixtQkFBbUIsbUJBQU8sQ0FBQyxxR0FBWTtBQUN2QyxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL2RvdHVpLy4vbm9kZV9tb2R1bGVzLy5wbnBtL2lzb3dzQDEuMC42X3dzQDguMTguMC9ub2RlX21vZHVsZXMvaXNvd3MvX2Nqcy9pbmRleC5qcz9iNzg2Il0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XZWJTb2NrZXQgPSB2b2lkIDA7XG5jb25zdCBXZWJTb2NrZXRfID0gcmVxdWlyZShcIndzXCIpO1xuY29uc3QgdXRpbHNfanNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuZXhwb3J0cy5XZWJTb2NrZXQgPSAoKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiAoMCwgdXRpbHNfanNfMS5nZXROYXRpdmVXZWJTb2NrZXQpKCk7XG4gICAgfVxuICAgIGNhdGNoIHtcbiAgICAgICAgaWYgKFdlYlNvY2tldF8uV2ViU29ja2V0KVxuICAgICAgICAgICAgcmV0dXJuIFdlYlNvY2tldF8uV2ViU29ja2V0O1xuICAgICAgICByZXR1cm4gV2ViU29ja2V0XztcbiAgICB9XG59KSgpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/utils.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/utils.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.getNativeWebSocket = void 0;\nfunction getNativeWebSocket() {\n    if (typeof WebSocket !== \"undefined\")\n        return WebSocket;\n    if (typeof global.WebSocket !== \"undefined\")\n        return global.WebSocket;\n    if (typeof window.WebSocket !== \"undefined\")\n        return window.WebSocket;\n    if (typeof self.WebSocket !== \"undefined\")\n        return self.WebSocket;\n    throw new Error(\"`WebSocket` is not supported in this environment\");\n}\nexports.getNativeWebSocket = getNativeWebSocket;\n//# sourceMappingURL=utils.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vaXNvd3NAMS4wLjZfd3NAOC4xOC4wL25vZGVfbW9kdWxlcy9pc293cy9fY2pzL3V0aWxzLmpzIiwibWFwcGluZ3MiOiJBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELDBCQUEwQjtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZG90dWkvLi9ub2RlX21vZHVsZXMvLnBucG0vaXNvd3NAMS4wLjZfd3NAOC4xOC4wL25vZGVfbW9kdWxlcy9pc293cy9fY2pzL3V0aWxzLmpzPzk4YTAiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmdldE5hdGl2ZVdlYlNvY2tldCA9IHZvaWQgMDtcbmZ1bmN0aW9uIGdldE5hdGl2ZVdlYlNvY2tldCgpIHtcbiAgICBpZiAodHlwZW9mIFdlYlNvY2tldCAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgcmV0dXJuIFdlYlNvY2tldDtcbiAgICBpZiAodHlwZW9mIGdsb2JhbC5XZWJTb2NrZXQgIT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgIHJldHVybiBnbG9iYWwuV2ViU29ja2V0O1xuICAgIGlmICh0eXBlb2Ygd2luZG93LldlYlNvY2tldCAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5XZWJTb2NrZXQ7XG4gICAgaWYgKHR5cGVvZiBzZWxmLldlYlNvY2tldCAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgcmV0dXJuIHNlbGYuV2ViU29ja2V0O1xuICAgIHRocm93IG5ldyBFcnJvcihcImBXZWJTb2NrZXRgIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBlbnZpcm9ubWVudFwiKTtcbn1cbmV4cG9ydHMuZ2V0TmF0aXZlV2ViU29ja2V0ID0gZ2V0TmF0aXZlV2ViU29ja2V0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/isows@1.0.6_ws@8.18.0/node_modules/isows/_cjs/utils.js\n");

/***/ })

};
;