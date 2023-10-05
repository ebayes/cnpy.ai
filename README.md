# Canopy (cnpy.ai)

Canopy is a privacy-preserving tool that helps conservationists sort camera trap data using machine learning without any data leaving the browser. It works best with datasets under 500 images. A test dataset can be found [here](https://drive.google.com/drive/folders/14LSwjlZqYIyje114y_Tq5L82Re9HWulo?usp=sharing).

Features:

- Powered by [ONNX runtime](https://onnxruntime.ai/)
- Built-in caching. When using in the browser, downloaded models are stored in IndexedDB using [localforage](https://github.com/localForage/localForage).
- No data leaves a users computer. Models can be deployed using only a few lines of code, meaning conservationists can finetune models locally and upload them to their browser easily.

## How it works

-  Canopy, uses Edge Functions to deploy models directly in web browser using open source packages like ONNX Runtime so no data leaves a users computer. Models can be deployed using only a few lines of code, meaning conservationists can finetune models locally and upload them to their browser easily.

## Thank yous

Canopy has been built using [Web AI](https://github.com/visheratin/web-ai), a TypeScript library that allows you to run modern deep learning models directly in the web browser. Special thanks to [visheratin](https://github.com/visheratin) who built WebAI and has provided ad hoc assistance.

## License

This project is licensed under the [MIT License](LICENSE).
