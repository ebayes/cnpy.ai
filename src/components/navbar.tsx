// navbar.tsx

import InputFieldsComponent from "@/components/classes";
import Tooltip from "@/components/tooltip";
import {
  MultimodalModel,
  ZeroShotClassificationModel,
} from "@visheratin/web-ai/multimodal";
import { SegmentationModel, ModelType } from "@visheratin/web-ai/image"
import { SessionParams } from "@visheratin/web-ai";
import React, { useEffect, useRef, useState } from "react";
import { Select, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconPlayerStop, IconPower, IconTerminal2, IconX } from '@tabler/icons-react';

interface NavbarComponentProps {
  onInputChange: (inputs: string[]) => void;
  modelCallback: (model: ZeroShotClassificationModel) => void;
  process: (
    power: number,
    statusCallback: (status: {
      progress: number;
      busy: boolean;
      message: string;
    }) => void
  ) => void;
  generateScript: () => void;
  classNum: number;
  stopProcessing: () => void;
}

export const NavbarComponent: React.FC<NavbarComponentProps> = (
  props: NavbarComponentProps
) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const powerRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState({
    progress: 0,
    busy: false,
    message: "Waiting for AI",
  });

  const [modelLoaded, setModelLoaded] = useState(false);
  const [otherLoaded, setOtherLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState('CLIP');


  const setProgressValue = (percentage: number) => {
    progressRef.current!.style.width = `${percentage}%`;
  };

  const loadCLIP = async () => {
    const power = 4;
    SessionParams.numThreads = power;
    setStatus({ ...status, busy: true, message: "Initializing AI..." });
    const modelResult = await MultimodalModel.create("clip-base-quant");
    console.log(`Model loading time: ${modelResult.elapsed}s`);
    props.modelCallback(modelResult.model as ZeroShotClassificationModel);
    setModelLoaded(true);
    setStatus({ ...status, busy: false, message: "AI was initialized!" });
    setTimeout(() => {
      setStatus({ ...status, message: "Ready" });
    }, 2000);
  };

  const loadOther = () => {
  {/* 
    const metadata = {
      id: "segformer-b0-segmentation-quant",
      memEstimateMB: 50,
      modelPaths: new Map<string, string>([
        [
          "model",
          "https://web-ai-models.org/image/segmentation/segformer-b0/model-quant.onnx.gz",
        ],
      ]),
      configPath:
        "https://web-ai-models.org/image/segmentation/segformer-b0/config.json",
      preprocessorPath:
        "https://web-ai-models.org/image/segmentation/segformer-b0/preprocessor_config.json",
    }
    const model = new SegmentationModel(metadata);
    const elapsed = await model.init()
    console.log(elapsed)
    */}
  };





  

  const process = () => {
    const power = 4;
    props.process(power, setStatus);
  };

  useEffect(() => {
    setProgressValue(status.progress);
  }, [status.progress]);

  return (
    <nav className="bg-white p-6 lg:w-80 lg:h-screen">
      <div className="grid grid-cols-1 gap-4">
        <div
          className="grid grid-cols-1 gap-4"
          style={modelLoaded ? { display: "none" } : {}}
        >
          <div>
            <h4 className="text-xl">Model</h4>
          </div>
          <Select
            placeholder="Choose model"
            defaultValue="CLIP"
            data={[
              { value: 'CLIP', label: 'CLIP' },
              { value: 'Other', label: 'Other' },
            ]}
            onChange={(value) => setSelectedModel(value)}
          />

          
        <button
          disabled={status.busy}
          onClick={() => {
            if (selectedModel === 'CLIP') {
              loadCLIP();
            } else if (selectedModel === 'Other') {
              loadOther();
            }
          }}
          className="bg-orange-400 text-white py-2 px-4 rounded hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <IconPower/>
        </button>

        </div>

        <div
          className="grid grid-cols-1 gap-4"
          style={modelLoaded ? {} : { display: "none" }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 className="text-xl">Set classes</h4>
          <ActionIcon 
            variant="transparent"
            disabled={status.busy}
            onClick={() => setModelLoaded(false)}
            style={!modelLoaded ? { display: "none" } : {}}
          >
            <IconX size="1rem" />
          </ActionIcon>
        </div>

          <InputFieldsComponent
            onInputChange={props.onInputChange}
            busy={status.busy}
            modelLoaded={modelLoaded}
          />
        </div>
        
        <button
          disabled={status.busy || !modelLoaded}
          hidden={!modelLoaded || props.classNum === 0 || status.busy}
          onClick={() => process()}
          className="bg-emerald-500 text-white text-xl py-2 my-2 px-4 rounded focus:outline-none"
        >
          <IconPlayerPlay/>
        </button>
        <button
          hidden={!modelLoaded || props.classNum === 0 || !status.busy}
          onClick={() => {
            console.log("stopping");
            props.stopProcessing();
          }}
          className="bg-emerald-500 text-white py-2 my-2 px-4 rounded focus:outline-none"
        >
          <IconPlayerStop/>
        </button>
        <button
          disabled={status.busy || !modelLoaded}
          hidden={
            !modelLoaded || props.classNum === 0 || status.progress !== 100
          }
          onClick={() => props.generateScript()}
          className="bg-rose-400 text-white text-xl py-2 px-4 rounded focus:outline-none"
        >
          <IconTerminal2/>
        </button>
        <div className="h-2 mt-4 bg-gray-200 rounded">
          <div
            id="progress-bar"
            ref={progressRef}
            className="h-full bg-blue-600 rounded"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        <div>
          <p className="font-semibold text-gray-700">
            Status: <span className="font-normal">{status.message}</span>
          </p>
        </div>
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-400"></div>
        </div>
      </div>
    </nav>
  );
};
