// convertName.tsx

export function convertName(name: string): string {

  if (name.toLowerCase().includes("impala") || 
      name.toLowerCase().includes("ibex") ||
      name.toLowerCase().includes("gazelle") || 
      name.toLowerCase().includes("bighorn") ||
      name.toLowerCase().includes("hartebeest")) {
    return "Deer"; 
  }

  if (name.toLowerCase().includes("water buffalo") ||
      name.toLowerCase().includes("bison") ||  
      name.toLowerCase().includes("ox")) {
    return "Buffalo or Takin";
  }

  if (name.toLowerCase().includes("spotlight") ||
      name.toLowerCase().includes("cliff") ||  
      name.toLowerCase().includes("valley")) {
    return "Blank";
  }

  if (name.toLowerCase().includes("wild boar") ||
      name.toLowerCase().includes("warthog")) {
    return "Wild pig";
  }

  if (name.toLowerCase().includes("black bear") ||
      name.toLowerCase().includes("sloth bear")) {
    return "Black bear";
  }

  if (name.toLowerCase().includes("tiger")) {
    return "Tiger";
  }

  if (name.toLowerCase().includes("leopard") ||
      name.toLowerCase().includes("cheetah")) {
    return "Leopard";
  }

  if (name.toLowerCase().includes("dhole")) {
    return "Wild dog";
  }

  if (name.toLowerCase().includes("lesser panda")) {
    return "Red panda";
  }

  if (name.toLowerCase().includes("cougar") ||
      name.toLowerCase().includes("jaguar") ||
      name.toLowerCase().includes("lynx") ||
      name.toLowerCase().includes("snow leopard")) {
    return "Other big cat";
  }

  if (name.toLowerCase().includes("weasel") ||
      name.toLowerCase().includes("otter")) {
    return "Marten"; 
  }

  return "Unknown";
}