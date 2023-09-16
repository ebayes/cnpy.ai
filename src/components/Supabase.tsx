// supabase.tsx

import { createClient } from "@supabase/supabase-js";
import { convertName } from "@/components/convertName";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getIpAddress() {
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
}

export async function logRun(
  selectedModel: string, 
  imageCount: number, 
  classesCount: Record<string, number>, 
  elapsed: number,
) {
  try {
    const speed = (imageCount / elapsed).toFixed(2);
    const timesorted = (elapsed).toFixed(2);
    const ipAddress = await getIpAddress();

    // Apply convertName to classesCount keys if selectedModel is "Other"
    let convertedClassesCount: Record<string, number> = {};
    if (selectedModel === "Other") {
      for (const [key, value] of Object.entries(classesCount)) {
        const convertedKey = convertName(key);
        convertedClassesCount[convertedKey] = (convertedClassesCount[convertedKey] || 0) + value;
      }
    } else {
      convertedClassesCount = classesCount;
    }

    const { error } = await supabase
      .from("canopy")
      .insert({ 
        model: selectedModel,
        totalimages: imageCount,
        classes: convertedClassesCount,
        timesorted: timesorted,
        speed: speed,
        ipaddress: ipAddress,
        category: "logrun",
      })
      .single();
    if (error) throw error;
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
}

export async function logFinal(
  selectedModel: string, 
  imageCount: number, 
  finalCount: Record<string, { totalImages: number, accuracy: number }>, 
  elapsed: number,
) {
  try {
    const speed = (imageCount / elapsed).toFixed(2);
    const timesorted = (elapsed).toFixed(2);
    const ipAddress = await getIpAddress();

    const { error } = await supabase
      .from("canopy")
      .insert({ 
        model: selectedModel,
        totalimages: imageCount,
        classes: finalCount,
        timesorted: timesorted,
        speed: speed,
        ipaddress: ipAddress,
        category: "finalrun",
      })
      .single();
    if (error) throw error;
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
}

export async function logFeedback(
  feedbackName: string, 
  feedbackEmail: string, 
  feedbackMessage: string
) {
  try {
    const { error } = await supabase
      .from("canopy")
      .insert({ 
        name: feedbackName,
        email: feedbackEmail,
        message: feedbackMessage,
        category: "feedback",
      })
      .single();
    if (error) throw error;
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
}
