// page.tsx

"use client";

import Image from 'next/image';
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
import FileLoader2 from "@/components/fileLoader2";
import CodeSnippetModal from "@/components/codeSnippet";
import FooterComponent from "@/components/footer";
import ClassSelector from "@/components/classSelector";
import { Select, ActionIcon, Drawer, Text, Loader, Button, Badge, Tooltip, Slider, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import InputFieldsComponent from "@/components/classes";
import DrawerContent from "@/components/drawer";
import { SegmentationModel, ModelType } from "@visheratin/web-ai/image"
import { SessionParams } from "@visheratin/web-ai";
import { IconArrowBarLeft, IconBrain, IconEdit, IconHelpCircle, IconPlayerPlay, IconPlayerStop, IconPower, IconTerminal2, IconUpload, IconX } from '@tabler/icons-react';

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
  const [selectedClass, setSelectedClass] = useState('All');
  const [totalImagesPerClass, setTotalImagesPerClass] = useState<Record<string, number>>(
    classNames.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
  );

  useEffect(() => {
    const totalImages: Record<string, number> = {};
    for (const cls of classFiles) {
      totalImages[cls.name] = cls.files.length + cls.duplicates.reduce((acc, curr) => acc + curr.files.length, 0);
    }
    setTotalImagesPerClass(totalImages);
  }, [classFiles]);
  
  

  // Count classes and edits
  const [classChanges, setClassChanges] = useState<Record<string, number>>(() => {
    const changes: Record<string, number> = {};
    classNames.forEach((className) => {
      changes[className] = 0;
    });
    return changes;
  });


  const MARKS = [
    { value: 1, label: 'sm' },
    { value: 50, label: 'md' },
    { value: 100, label: 'lg' },
  ];

  const classOptions = [
    {label: 'All', value: 'All'},
    {label: 'Unsorted', value: 'Unsorted'}, // new option
    ...classNames.map(name => ({label: name, value: name}))
  ];
  

  const filteredClasses = 
  selectedClass === 'All' ? classFiles : 
  selectedClass === 'Unsorted' ? [ { name: 'Unsorted', files: unsortedFiles, duplicates: [] } ] : 
  classFiles.filter(c => c.name === selectedClass);


  const onInputChange = (inputs: string[]) => {
    setClassNames(inputs);
    setClassNum(inputs.length);
  };
  

  const modelCallback = (model: ZeroShotClassificationModel) => {
    setModel(model);
    const changes: Record<string, number> = {};
    classNames.forEach((className) => {
      changes[className] = 0;
    });
    setClassChanges(changes);
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
    for (let i = 0; i < classFiles.length; i++) {
      const cls = classFiles[i];
      const totalImages = cls.files.length + cls.duplicates.length;
      if (!isNaN(totalImages)) {
        setTotalImagesPerClass(prevState => ({ ...prevState, [cls.name]: totalImages }));
      }      
      const classChangeCount = classChanges[cls.name] || 0;
  
      // Calculate percent accuracy rounded to 0 decimal points
      const percentAccuracy = Math.round(((totalImages - classChangeCount) / totalImages) * 100);
  
      // Generate the log message
      let logMessage = `${totalImages} ${cls.name}; ${classChangeCount} errors`;
      if (!isNaN(percentAccuracy)) {
        logMessage += ` (${percentAccuracy}% accuracy)`;
      }
  
      // Append logging messages to commands
      unixCommands.push(`echo "${logMessage}" >> summary.txt`);
      winCommands.push(`echo "${logMessage}" >> summary.txt`);
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
    file.classPredictions[0].class = clsName;
    setClassChanges((prev) => ({
      ...prev,
      [clsName]: (prev[clsName] || 0) + 1,
      [currentClass]: (prev[currentClass] || 0) + 1,
    }));
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
  const [selectedModel, setSelectedModel] = useState('Custom');

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

  const bgColors = [
    "bg-red-300",
    "bg-blue-300",
    "bg-green-300",
    "bg-indigo-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-gray-300",
    "bg-teal-300",
    "bg-lime-300",
    "bg-rose-300",
    "bg-cyan-300",
    "bg-orange-300",
    "bg-amber-300",
    "bg-emerald-300",
    "bg-violet-300",
    "bg-sky-300",
    "bg-fuchsia-300"
  ];
  
  
  let colorIndex = 0;
  
  function getNextBgColor() {
    const selectedColor = bgColors[colorIndex];
    colorIndex = (colorIndex + 1) % bgColors.length;
    return selectedColor;
  }

  const totalImagesAllClasses = Object.values(totalImagesPerClass).reduce((sum, count) => sum + count, 0);



  return (
    <div style={{ minHeight: '100vh' }} className="flex flex-col">

      <header 
        id="header" 
        style={{backgroundColor: "#F7F3EC", borderBottom: "1px solid #E4E1D8"}}
        className="px-5 py-3 flex justify-between h-15"
      >
        <Image 
          src="/icons/logo.png" 
          alt="Logo" 
          className="object-contain"
          width={120}
          height={120}
        />
        <Tooltip
          multiline
          width={200}
          label="Canopy is a privacy-preserving tool for conservationists to sort camera trap data using machine learning without any data leaving their browser."
          color="dark"
          withArrow
          arrowPosition="center"
          transitionProps={{ duration: 200 }}
        >
        <ActionIcon 
          size="lg"
          className="text-black flex items-center justify-center"
        >
          <IconHelpCircle size="1rem"/>
        </ActionIcon >
        </Tooltip>
      </header>
      <header 
        id="subheader" 
        style={{backgroundColor: "#F9F8F5", borderBottom: "1px solid #E4E1D8"}}
        className="px-5 py-1.5 h-[3rem] flex justify-between"
      >
        <FileLoader setNewFiles={setNewFiles} />
        <div
  id="mainbuttons"
  className="flex items-center space-between gap-2"
>




      <Tooltip
        label="Edit model settings"
        color="dark"
        withArrow
        arrowPosition="center"
      >
      <Button 
        rightIcon={<IconHelpCircle size="1rem" />}
        onClick={open}
        className="bg-blue-100 text-blue-400 hover:text-blue-600 hover:bg-blue-300  flex items-center justify-center"
      >
        Model
      </Button>
      </Tooltip>

        <div className="w-40">
        <Select
          placeholder="Choose model"
          defaultValue="Custom"
          data={[
            { value: 'Custom', label: 'Custom' },
            { value: 'Other', label: 'Other' },
          ]}
          onChange={(value) => setSelectedModel(value || '')}
        />
        </div>

      
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
            size="lg"
            onClick={() => {
              if (selectedModel === 'Custom') {
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
            size="lg"
            disabled={status.busy}
            onClick={() => setModelLoaded(false)}
            className="bg-red-500 text-white hover:bg-red-600  flex items-center justify-center"
          >
            <IconPower size="1rem"/>
          </ActionIcon>
        </Tooltip>
       </div>
        
        
        
    {(!modelLoaded || classNum === 0 || !status.busy) ? ( 
    <Tooltip
          label="Run model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
      <ActionIcon
        size="lg"
        disabled={!modelLoaded || classNum === 0 || status.busy}
        onClick={() => process()}
        className="bg-emerald-500 text-white hover:bg-emerald-600  flex items-center justify-center"
      >
        <IconPlayerPlay size="1rem"/>
      </ActionIcon>
    </Tooltip>
   ) : ( 
    
      
        <Avatar 
        variant="filled" 
        color="orange"
        size="sm"
        style={{ width: '35px', height: '35px' }}
      >
        {Math.round(status.progress)}%
      </Avatar>
 
   )} 

    

        
        <ActionIcon
          size="lg"
          disabled={!modelLoaded || classNum === 0 || !status.busy}
          onClick={() => {
            console.log("stopping");
            stopProcessing();
          }}
          className="bg-red-500 text-white hover:bg-red-600  flex items-center justify-center"
        >
          <IconPlayerStop size="1rem"/>
        </ActionIcon>
  


        <Tooltip
          label="Terminal commands"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon 
          size="lg"
          disabled={status.busy || !modelLoaded || classNum === 0 || status.progress !== 100}
          onClick={() => generateScript()}
          className="bg-emerald-500 text-white hover:bg-emerald-600  flex items-center justify-center"
        >
          <IconTerminal2 size="1rem"/>
        </ActionIcon >
        </Tooltip>
        </div>
      </header>

      <header id="subsubheader" className="px-5 py-2.5 flex justify-between">
      <div 
        id="leftbuttons" 
        style={files.length === 0 ? { visibility: "hidden" } : { visibility: "visible" }}
        className="flex items-center"
      >
  {/* 
  <div id="dropdown" className="w-40 mr-2">
    <Select
      placeholder="Choose class"
      value={selectedClass}
      data={classOptions}
      onChange={setSelectedClass}
    />
  </div>
  */}
  <div id="logTotalImagesInBadges" className="gap-2 space-x-2">
  <Button 
  id={`badgeclass-all`} 
  key="UnsortedFiles" 
  radius="xl" 
  size="xs"
  compact
  onClick={() => setSelectedClass("All")}
  className={`bg-gray-400 text-white hover:bg-gray-500`}
>
  {files.length} Images
</Button>
  <Button 
  style={!modelLoaded ? { display: "none" } : {}}
  id={`badgeclass-unsorted`} 
  key="UnsortedFiles" 
  radius="xl" 
  size="xs"
  compact
  onClick={() => setSelectedClass("Unsorted")}
  className={`bg-yellow-400 text-white hover:bg-gray-500`}
>
  {unsortedFiles.length} Unsorted
</Button>
    {Object.entries(totalImagesPerClass)
      .filter(([clsName, totalImages]) => totalImages > 0)
      .map(([clsName, totalImages]) => {
        const nextColor = getNextBgColor(); 

        return (
          <Button 
            id={`badgeclass-${clsName}`} 
            key={clsName} 
            radius="xl" 
            size="xs"
            compact
            onClick={() => setSelectedClass(clsName)}
            className={`${nextColor} text-white hover:bg-gray-500`}
          >
            {totalImages} {clsName}
          </Button>
        );
      })}
  </div>
</div>

        
        {/*  <div id="changesize" style={ { width: '160px' } } className="items-center">
          <Slider
            disabled
            color="dark"
            size="sm"
            showLabelOnHover={false}
            marks={[
              { value: 1, label: 'sm' },
              { value: 50, label: 'md' },
              { value: 100, label: 'lg' },
            ]}
            defaultValue={50}
            step={50}
          />
        </div>
        */}
      </header>


      <div className="flex flex-col lg:flex-row flex-grow h-full">
        <nav className="bg-white">
          <Drawer 
            opened={opened} 
            onClose={close} 
            title="Model settings"
            position="right"
            size="xs"
          >
          <div id="modelsettings" className="grid grid-cols-1 gap-4">  
            <div className="grid grid-cols-1 gap-4">
              <DrawerContent/>
              <InputFieldsComponent
                onInputChange={onInputChange}
                busy={status.busy}
                modelLoaded={modelLoaded}
              />
            </div>
          </div>
        </Drawer>

        </nav>
        
        <main 
          id="photos" 
          style={{ maxHeight: '71vh' }}
          className="flex flex-grow px-5 overflow-auto"
        > 
        {files.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <FileLoader2 setNewFiles={setNewFiles} />
          </div>
        ) : 
          selectedClass === 'All'
            ? <PhotoGallery
                images={unsortedFiles.concat(...classFiles.flatMap(c => c.files))} // concatenate unsortedFiles and each file of classFile
                duplicates={[]}
                markDeleted={markDeleted}
                moveToClass={startFileMoving}
              />
            : filteredClasses.map(item => (
              <section key={item.name}>
                {selectedClass !== 'All' && item.files.length === 0 &&
                  <Text>No {item.name} images found</Text> 
                }     
                <PhotoGallery
                  images={item.files}
                  duplicates={item.duplicates}
                  markDeleted={markDeleted}
                  moveToClass={startFileMoving}
                />
              </section>
            ))}
      </main>


      </div>
      <footer 
        id="footer" 
        className="bg-[#F7F3EC] border-t-[1px] border-[#E4E1D8] px-5 py-3 flex items-center justify-center h-[3rem]"
      >
        <Text fz="sm" ta="center">
          Built by <a href="https://www.general-purpose.io"><Text span inherit>General Purpose</Text></a>; powered by <a href="https://github.com/visheratin/web-ai"><Text span inherit>WebAI</Text></a>.
        </Text>
      </footer>

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
    </div> 
);
}