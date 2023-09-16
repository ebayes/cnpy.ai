// import { logFinal } from "@/components/Supabase";
import { FileInfo } from "@/components/fileInfo";
import { ClassData } from "@/components/classData";

export const generateScript = (
  unsortedFiles: FileInfo[], 
  classFiles: ClassData[], 
  selectedModel: string, 
  convertName: (name: string) => string, 
  files: FileInfo[], 
  status: { message: string }, 
  classChanges: Record<string, number>, 
  setTotalImagesPerClass: (callback: (prevState: Record<string, number>) => Record<string, number>) => void, 
  setUnixScript: (script: string) => void, 
  setWinScript: (script: string) => void, 
  setModalOpen: (isOpen: boolean) => void, 
) => {
  const unixCommands: string[] = [];
  const winCommands: string[] = [];
  const unsorted = unsortedFiles.filter((f) => f.toDelete);
  for (let i = 0; i < unsorted.length; i++) {
    const file = unsorted[i];
    unixCommands.push(`rm "${file.name}"`);
    winCommands.push(`del /q "${file.name}"`);
  }

  // Group classes by name
  const groupedClasses = classFiles.reduce((grouped, cls) => {
    let className = cls.name;
    if (selectedModel === "Other") {
      className = convertName(className);
    }
    if (!grouped[className]) {
      grouped[className] = [];
    }
    grouped[className].push(cls);
    return grouped;
  }, {} as Record<string, ClassData[]>);

  // Generate commands for each group of classes
  for (const className in groupedClasses) {
    unixCommands.push(`mkdir "${className}"`);
    winCommands.push(`mkdir "${className}"`);

    const clsGroup = groupedClasses[className];
    for (const cls of clsGroup) {
      for (const file of cls.files) {
        if (file.toDelete) {
          unixCommands.push(`rm "${file.name}"`);
          winCommands.push(`del /q "${file.name}"`);
        } else {
          unixCommands.push(`mv "${file.name}" "${className}"/`);
          winCommands.push(`move "${file.name}" "${className}"/`);
        }
      }
      for (const dupes of cls.duplicates) {
        for (const file of dupes.files) {
          if (file.toDelete) {
            unixCommands.push(`rm "${file.name}"`);
            winCommands.push(`del /q "${file.name}"`);
          } else {
            unixCommands.push(`mv "${file.name}" "${className}"/`);
            winCommands.push(`move "${file.name}" "${className}"/`);
          }
        }
      }
    }
  }
    unixCommands.push(`echo "Model used: ${selectedModel}. ${files.length} images sorted in ${status.message}s" >> summary.txt`);
    winCommands.push(`echo "Model used: ${selectedModel}. ${files.length} images sorted in ${status.message}s" >> summary.txt`);
    const logMessages = new Map<string, number>();

    // Create a new map to store the total images and accuracy for each class
    const classStats = new Map<string, { totalImages: number, totalAccuracy: number, count: number }>();

    for (let i = 0; i < classFiles.length; i++) {
      const cls = classFiles[i];
      let className = cls.name;
      if (selectedModel === "Other") {
        className = convertName(className);
      }
      const totalImages = cls.files.length + cls.duplicates.length;
      let percentAccuracy = 0;
      if (totalImages !== 0) {
        const classChangeCount = classChanges[className] || 0;
        percentAccuracy = Math.round(((totalImages - classChangeCount) / totalImages) * 100);
      }

      // Get the current stats for this class, or create a new one if it doesn't exist
      const stats = classStats.get(className) || { totalImages: 0, totalAccuracy: 0, count: 0 };

      // Add the total images and accuracy to the stats
      stats.totalImages += totalImages;
      stats.totalAccuracy += percentAccuracy;
      stats.count++;

      // Update the stats for this class
      classStats.set(className, stats);
    }

    // Generate the log messages
    for (const [className, stats] of classStats) {
      const averageAccuracy = Math.round(stats.totalAccuracy / stats.count);
      const logMessage = `${stats.totalImages} ${className}; ${averageAccuracy}% accuracy`;
      unixCommands.push(`echo "${logMessage}" >> summary.txt`);
      winCommands.push(`echo "${logMessage}" >> summary.txt`);
    }
    
    const unixScript = unixCommands.join("\n");
    const winScript = winCommands.join("\n");
    setUnixScript(unixScript);
    setWinScript(winScript);
    setModalOpen(true);


    // Prepare data for logFinal
    const imageCount = files.length;
    const finalCount: Record<string, { totalImages: number, accuracy: number }> = {};
    for (let i = 0; i < classFiles.length; i++) {
      const cls = classFiles[i];
      let className = cls.name;
      if (selectedModel === "Other") {
        className = convertName(className);
      }
      const totalImages = cls.files.length + cls.duplicates.length;
      const classChangeCount = classChanges[className] || 0;
      const percentAccuracy = Math.round(((totalImages - classChangeCount) / totalImages) * 100);
      finalCount[className] = {
        totalImages,
        accuracy: percentAccuracy
      };
    }
    const elapsed = parseFloat(status.message); // assuming status.message is the elapsed time in string format

    // Call logFinal
    // logFinal(selectedModel, imageCount, finalCount, elapsed);
  };