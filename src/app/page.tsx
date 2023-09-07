// page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import PhotoGallery from "@/components/gallery";
import { FileInfo } from "@/components/fileInfo";
import { ClassData } from "@/components/classData";
import {
  MultimodalModel,
  ZeroShotClassificationModel,
  ZeroShotResult,
} from "@visheratin/web-ai/multimodal";
import { ClassificationPrediction } from "@visheratin/web-ai/image";
import FileLoader from "@/components/fileLoader";
import CodeSnippetModal from "@/components/codeSnippet";
import FooterComponent from "@/components/footer";
import ClassSelector from "@/components/classSelector";
import { Select, ActionIcon, Drawer, Text, Loader, Button, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import InputFieldsComponent from "@/components/classes";
import { SegmentationModel, ModelType } from "@visheratin/web-ai/image"
import { SessionParams } from "@visheratin/web-ai";
import { IconBrain, IconLayoutSidebarRightExpandFilled, IconPlayerPlay, IconPlayerStop, IconPower, IconTerminal2, IconUpload, IconX } from '@tabler/icons-react';

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

export default function Home() {
  const [classNames, setClassNames] = useState<string[]>([]);
  const [unsortedFiles, setUnsortedFiles] = useState<FileInfo[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [classFiles, setClassFiles] = useState<ClassData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [unixScript, setUnixScript] = useState("");
  const [winScript, setWinScript] = useState("");
  const toStop = useRef(false);
  const [movingFile, setMovingFile] = useState<FileInfo | undefined>();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const onInputChange = (inputs: string[]) => {
    setClassNames(inputs);
    setClassNum(inputs.length);
  };
  

  const modelCallback = (model: ZeroShotClassificationModel) => {
    setModel(model);
};

const [classNum, setClassNum] = useState<number>(0);



  const setNewFiles = (newFiles: FileInfo[]) => {
    const existingFiles = files.map((file) => file.hash);
    const filteredNewFiles = newFiles.filter(
      (file) => !existingFiles.includes(file.hash)
    );
    setUnsortedFiles((prevFiles: FileInfo[]) => {
      return [...prevFiles, ...filteredNewFiles];
    });
    setFiles((prevFiles: FileInfo[]) => {
      return [...prevFiles, ...filteredNewFiles];
    });
  };

  const [model, setModel] = useState<ZeroShotClassificationModel>();

  const processFiles = async (
    power: number,
    setStatus: (status: {
      progress: number;
      busy: boolean;
      message: string;
    }) => void
  ) => {
    if (!model) {
      setStatus({ busy: false, progress: 0, message: "Model was not loaded!" });
      setTimeout(() => {
        setStatus({
          busy: false,
          progress: 0,
          message: "Waiting for the model",
        });
      }, 2000);
      return;
    }
    const classes = [...classNames];
    if (
      classes.length === 0 ||
      classes.filter((c) => c.length > 0).length === 0
    ) {
      setStatus({
        busy: false,
        progress: 0,
        message: "No classes were set!",
      });
      return;
    }
    const newClasses = classes.map((name): ClassData => {
      return {
        name: name,
        files: [],
        duplicates: [],
      };
    });
    setStatus({ progress: 0, busy: true, message: "Processing..." });
    const start = performance.now();
    const batch = power;
    const dataFiles = [...files];
    setUnsortedFiles([...files]);
    for (let i = 0; i < dataFiles.length; i += batch) {
      setStatus({
        busy: true,
        message: "Processing...",
        progress: (i / dataFiles.length) * 100,
      });
      const toProcessFiles = dataFiles.slice(i, i + batch);
      const toProcess = toProcessFiles.map((file) => file.src);
      const result = (await model.process(
        toProcess,
        classes
      )) as ZeroShotResult;
      if (toProcess.length === 1) {
        const prediction = result.results as ClassificationPrediction[];
        processResult(
          toProcessFiles[0],
          prediction,
          result.imageFeatures[0],
          newClasses,
          classes
          
        );
      } else {
        const predictions = result.results as ClassificationPrediction[][];
        predictions.forEach((pred, index) => {
          const prediction = pred as ClassificationPrediction[];
          processResult(
            toProcessFiles[index],
            prediction,
            result.imageFeatures[index],
            newClasses,
            classes
          );
        });
      }
      if (toStop.current) {
        setStatus({
          progress: 0,
          busy: false,
          message: "Stopped",
        });
        toStop.current = false;
        return;
      }
    }
    const end = performance.now();
    const elapsed = Math.round((end - start) / 10) / 100;
    setStatus({
      progress: 100,
      busy: false,
      message: `Finished in ${elapsed}s`,
    });
    findDuplicates(newClasses);
  };

  const processResult = (
    file: FileInfo,
    result: ClassificationPrediction[],
    embedding: number[],
    classData: ClassData[],
    classes: string[]
  ) => {
    file.classPredictions = result;
    if (result.length === 0) {
      return;
    }
    if (result[0].confidence < 0.5) {
      return;
    }
    file.embedding = embedding;
    const foundClass = result[0].class;
    const foundClassIndex = classes.indexOf(foundClass);
    classData[foundClassIndex].files.push(file);
    setClassFiles([...classData]);
    setUnsortedFiles((prevFiles: FileInfo[]) => {
      const unsortedIdx = prevFiles.indexOf(file);
      prevFiles.splice(unsortedIdx, 1);
      return [...prevFiles];
    });
    return;
  };

  const cosineSim = (vector1: number[], vector2: number[]) => {
    let dotproduct = 0;
    let m1 = 0;
    let m2 = 0;
    for (let i = 0; i < vector1.length; i++) {
      dotproduct += vector1[i] * vector2[i];
      m1 += vector1[i] * vector1[i];
      m2 += vector2[i] * vector2[i];
    }
    m1 = Math.sqrt(m1);
    m2 = Math.sqrt(m2);
    const sim = dotproduct / (m1 * m2);
    return sim;
  };

  const findDuplicates = async (clsFiles: ClassData[]) => {
    const result: ClassData[] = [];
    clsFiles.forEach((classData: ClassData) => {
      const files = classData.files;
      const duplicates: FileInfo[][] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let dupeFound = false;
        for (let j = 0; j < duplicates.length; j++) {
          const dupes = duplicates[j];
          for (let k = 0; k < dupes.length; k++) {
            const dupe = dupes[k];
            const sim = cosineSim(
              file.embedding as number[],
              dupe.embedding as number[]
            );
            if (sim > 0.9) {
              dupes.push(file);
              files.splice(i, 1);
              dupeFound = true;
              break;
            }
          }
          if (dupeFound) {
            break;
          }
        }
        if (dupeFound) {
          i--;
          continue;
        }
        for (let j = i + 1; j < files.length; j++) {
          const file2 = files[j];
          const sim = cosineSim(
            file.embedding as number[],
            file2.embedding as number[]
          );
          if (sim > 0.9) {
            const dupe: FileInfo[] = [file, file2];
            duplicates.push(dupe);
            files.splice(j, 1);
            files.splice(i, 1);
            i--;
            break;
          }
        }
      }
      classData.duplicates = [];
      for (let i = 0; i < duplicates.length; i++) {
        const dupes = duplicates[i];
        if (dupes.length > 1) {
          classData.duplicates.push({
            name: `Possible duplicate ${i}`,
            files: dupes,
            duplicates: [],
          });
        }
      }
      result.push(classData);
    });
    setClassFiles([...result]);
  };

  const markDeleted = (hash: string) => {
    const clsFiles = [...classFiles];
    for (let i = 0; i < clsFiles.length; i++) {
      const cls = clsFiles[i];
      for (let j = 0; j < cls.files.length; j++) {
        const file = cls.files[j];
        if (file.hash === hash) {
          file.toDelete = !file.toDelete;
          setClassFiles(clsFiles);
          return;
        }
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        for (let k = 0; k < dupes.files.length; k++) {
          const file = dupes.files[k];
          if (file.hash === hash) {
            file.toDelete = !file.toDelete;
            setClassFiles(clsFiles);
            return;
          }
        }
      }
    }
    const unsorted = [...unsortedFiles];
    for (let i = 0; i < unsorted.length; i++) {
      const file = unsorted[i];
      if (file.hash === hash) {
        file.toDelete = !file.toDelete;
        setUnsortedFiles(unsorted);
        return;
      }
    }
  };

  const generateScript = () => {
    const unixCommands: string[] = [];
    const winCommands: string[] = [];
    const unsorted = unsortedFiles.filter((f) => f.toDelete);
    for (let i = 0; i < unsorted.length; i++) {
      const file = unsorted[i];
      unixCommands.push(`rm "${file.name}"`);
      winCommands.push(`del /q "${file.name}"`);
    }
    const clsFiles = [...classFiles];
    for (let i = 0; i < clsFiles.length; i++) {
      unixCommands.push(`mkdir "${clsFiles[i].name}"`);
      winCommands.push(`mkdir "${clsFiles[i].name}"`);
      const cls = clsFiles[i];
      for (let j = 0; j < cls.files.length; j++) {
        const file = cls.files[j];
        if (file.toDelete) {
          unixCommands.push(`rm "${file.name}"`);
          winCommands.push(`del /q "${file.name}"`);
        } else {
          unixCommands.push(`mv "${file.name}" "${cls.name}"/`);
          winCommands.push(`move "${file.name}" "${cls.name}"/`);
        }
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        for (let k = 0; k < dupes.files.length; k++) {
          const file = dupes.files[k];
          if (file.toDelete) {
            unixCommands.push(`rm "${file.name}"`);
            winCommands.push(`del /q "${file.name}"`);
          } else {
            unixCommands.push(`mv "${file.name}" "${cls.name}"/`);
            winCommands.push(`move "${file.name}" "${cls.name}"/`);
          }
        }
      }
    }
    const unixScript = unixCommands.join("\n");
    const winScript = winCommands.join("\n");
    setUnixScript(unixScript);
    setWinScript(winScript);
    setModalOpen(true);
  };

  const stopProcessing = () => {
    console.log("Stopping processing");
    toStop.current = true;
  };

  const startFileMoving = (file: FileInfo | undefined) => {
    setMovingFile(file);
    setShowMoveModal(true);
  };

  const moveToClass = (file: FileInfo, clsName: string) => {
    console.log(`Moving ${file.name} to ${clsName}`);
    const clsFiles = [...classFiles];
    let currentClass = "";
    for (let i = 0; i < clsFiles.length; i++) {
      const cls = clsFiles[i];
      if (cls.files.includes(file)) {
        currentClass = cls.name;
        break;
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        if (dupes.files.includes(file)) {
          currentClass = cls.name;
          break;
        }
      }
    }
    if (currentClass === clsName) {
      return;
    }
    for (let i = 0; i < clsFiles.length; i++) {
      const cls = clsFiles[i];
      if (cls.name === clsName) {
        cls.files.push(file);
        continue;
      }
      if (cls.files.includes(file)) {
        cls.files.splice(cls.files.indexOf(file), 1);
        continue;
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        if (dupes.files.includes(file)) {
          dupes.files.splice(dupes.files.indexOf(file), 1);
          continue;
        }
      }
    }
    setClassFiles(clsFiles);
    for (let i = 0; i < unsortedFiles.length; i++) {
      const unsorted = unsortedFiles[i];
      if (unsorted === file) {
        unsortedFiles.splice(i, 1);
        break;
      }
    }
    setUnsortedFiles(unsortedFiles);
  };

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
  if (progressRef.current) {
    progressRef.current.style.width = `${percentage}%`;  
  }
};

  const loadCLIP = async () => {
    const power = 4;
    SessionParams.numThreads = power;
    setStatus({ ...status, busy: true, message: "Initializing AI..." });
    const modelResult = await MultimodalModel.create("clip-base-quant");
    console.log(`Model loading time: ${modelResult.elapsed}s`);
    modelCallback(modelResult.model as ZeroShotClassificationModel);
    setModelLoaded(true);
    setStatus({ ...status, busy: false, message: "AI was initialized!" });
    setTimeout(() => {
      setStatus({ ...status, message: "Ready" });
    }, 2000);
  };

  const loadOther = () => {
  
  };

  const process = () => {
    const power = 4;
    processFiles(power, setStatus);
  };
  

  useEffect(() => {
    setProgressValue(status.progress);
  }, [status.progress]);


  return (
    <>

      <header id="header" className="px-5 py-2.5 border-b border-gray-300 bg-gray-200">
        <img src="/icons/logo.png" alt="Logo" width="100"/>
    </header>
    <header 
      id="subheader" 
      className="px-5 py-2.5 border-b border-gray-300 flex justify-between"
    >
      <div id="leftbuttons">
        

      <FileLoader setNewFiles={setNewFiles} />

      </div>
    <div
    id="mainbuttons"
    className="flex space-between gap-3"
  >
    <Select
            placeholder="Choose model"
            defaultValue="CLIP"
            data={[
              { value: 'CLIP', label: 'CLIP' },
              { value: 'Other', label: 'Other' },
            ]}
            onChange={(value) => setSelectedModel(value)}
          />

          
        <Tooltip
          label="Model settings"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon
          onClick={open}
          className="bg-pink-400 text-white hover:bg-pink-600  flex items-center justify-center"
        >
          <IconBrain size="1rem"/>
        </ActionIcon>
        </Tooltip>
        <div style={modelLoaded ? { display: "none" } : {}}>
          
        <Tooltip
          label="Load model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon
          id="poweron"
          // disabled={status.busy}
          onClick={() => {
            if (selectedModel === 'CLIP') {
              loadCLIP();
            } else if (selectedModel === 'Other') {
              loadOther();
            }
          }}
          className="bg-orange-500 text-white hover:bg-orange-600  flex items-center justify-center"
        >
          {status.busy ? <Loader color="white" size="1rem" /> : <IconPower size="1rem"/>}
        </ActionIcon>
        </Tooltip>
        </div>
        <div style={!modelLoaded ? { display: "none" } : {}}>
        <Tooltip
          label="Unload model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon
          id="poweroff"
          disabled={status.busy}
          onClick={() => setModelLoaded(false)}
          className="bg-red-500 text-white hover:bg-red-600  flex items-center justify-center"
        >
          <IconPower size="1rem"/>
        </ActionIcon>
        </Tooltip>
        </div>
        



        
        <div style={status.busy ? { display: "none" } : {}}>
        <Tooltip
          label="Run model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon
          disabled={!modelLoaded || classNum === 0}
          onClick={() => process()}
          className="bg-emerald-500 text-white hover:bg-emerald-600  flex items-center justify-center"
        >
          <IconPlayerPlay size="1rem"/>
        </ActionIcon>
        </Tooltip>
        </div>

        <div style={!modelLoaded || classNum === 0 || !status.busy ? { display: "none" } : {}}>
        <ActionIcon
         
          onClick={() => {
            console.log("stopping");
            stopProcessing();
          }}
          className="bg-red-500 text-white hover:bg-red-600  flex items-center justify-center"
        >
          <IconPlayerStop size="1rem"/>
        </ActionIcon>
        </div>


        <Tooltip
          label="Terminal commands"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon 
          disabled={status.busy || !modelLoaded || classNum === 0 || status.progress !== 100}
          onClick={() => generateScript()}
          className="bg-emerald-500 text-white hover:bg-emerald-600  flex items-center justify-center"
        >
          <IconTerminal2 size="1rem"/>
        </ActionIcon >
        </Tooltip>


    </div>
    </header>

     
      <div className="flex flex-col lg:flex-row flex-grow min-h-screen">
<nav className="bg-white p-6 lg:w-80 lg:h-screen">
      
      
     

      <Drawer 
        opened={opened} 
        onClose={close} 
        title="Model"
        position="right"
      >
         
      </Drawer>

      <div id="modelsettings" className="grid grid-cols-1 gap-4">  
        <div className="grid grid-cols-1 gap-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 className="text-xl">Set classes</h4>
        </div>
          <InputFieldsComponent
            onInputChange={onInputChange}
            busy={status.busy}
            modelLoaded={modelLoaded}
          />
        </div>
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
        <div className="border-l border-gray-300 h-auto my-2"></div>
        <main className="flex-grow p-6 lg:w-80 lg:h-full">

          {classFiles.length > 0 &&
            classFiles.map(
              (item) =>
                (item.files.length > 0 || item.duplicates.length > 0) && (
                  <section
                    key={item.name}
                    
                  >
                    <h3 className="mb-4 text-xl font-semibold">{item.name}</h3>
                    <PhotoGallery
                      images={item.files}
                      duplicates={item.duplicates}
                      markDeleted={markDeleted}
                      moveToClass={startFileMoving}
                    />
                  </section>
                )
            )}
          {unsortedFiles.length > 0 && (
            <section >
              <h3 className="mb-4 text-xl font-semibold">Unsorted</h3>
              <PhotoGallery
                images={unsortedFiles}
                duplicates={[]}
                markDeleted={markDeleted}
                moveToClass={startFileMoving}
              />
            </section>
          )}
        </main>
      </div>

      <CodeSnippetModal
        unixCode={unixScript}
        windowsCode={winScript}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <ClassSelector
        classes={classNames}
        onClassSet={moveToClass}
        file={movingFile}
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
      />
    </>
  );
}
