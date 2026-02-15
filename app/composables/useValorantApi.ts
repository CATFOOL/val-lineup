// Valorant API 类型定义
export interface ValorantAgent {
  uuid: string;
  displayName: string;
  description: string;
  developerName: string;
  displayIcon: string;
  displayIconSmall: string;
  bustPortrait: string | null;
  fullPortrait: string | null;
  fullPortraitV2: string | null;
  killfeedPortrait: string;
  background: string | null;
  backgroundGradientColors: string[];
  isPlayableCharacter: boolean;
  role: {
    uuid: string;
    displayName: string;
    displayIcon: string;
  } | null;
  abilities: ValorantAbility[];
}

export interface ValorantAbility {
  slot: "Ability1" | "Ability2" | "Grenade" | "Ultimate" | "Passive";
  displayName: string;
  description: string;
  displayIcon: string | null;
}

export interface ValorantMap {
  uuid: string;
  displayName: string;
  narrativeDescription: string | null;
  tacticalDescription: string | null;
  coordinates: string | null;
  displayIcon: string | null;
  listViewIcon: string;
  listViewIconTall: string | null;
  splash: string;
  stylizedBackgroundImage: string | null;
  premierBackgroundImage: string | null;
  mapUrl: string;
  callouts: ValorantCallout[] | null;
}

export interface ValorantCallout {
  regionName: string;
  superRegionName: string;
  location: { x: number; y: number };
}

interface ValorantApiResponse<T> {
  status: number;
  data: T;
}

const API_BASE = "https://valorant-api.com/v1";

export const useValorantApi = () => {
  // 获取所有可玩角色 (按角色分类排序，同分类内按名称字母排序)
  const getAgents = async (
    language: string = "en-US",
  ): Promise<ValorantAgent[]> => {
    const { data } = await useFetch<ValorantApiResponse<ValorantAgent[]>>(
      `${API_BASE}/agents`,
      {
        query: {
          isPlayableCharacter: true,
          language,
        },
      },
    );
    const agents = data.value?.data || [];

    // 按名称字母排序
    return agents.sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  // 获取按角色分类的角色 (每个分类内按名称字母排序)
  const getAgentsGroupedByRole = async (
    language: string = "en-US",
  ): Promise<Record<string, ValorantAgent[]>> => {
    const agents = await getAgents(language);

    // 定义角色分类顺序
    const roleOrder = ["Duelist", "Initiator", "Controller", "Sentinel"];

    // 按角色分组
    const grouped: Record<string, ValorantAgent[]> = {};
    for (const agent of agents) {
      const roleName = agent.role?.displayName || "Other";
      if (!grouped[roleName]) {
        grouped[roleName] = [];
      }
      grouped[roleName].push(agent);
    }

    // 每组内按名称字母排序
    for (const role in grouped) {
      grouped[role]!.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    // 按角色顺序返回
    const ordered: Record<string, ValorantAgent[]> = {};
    for (const role of roleOrder) {
      if (grouped[role]) {
        ordered[role] = grouped[role]!;
      }
    }
    // 添加其他未知角色
    for (const role in grouped) {
      if (!ordered[role]) {
        ordered[role] = grouped[role]!;
      }
    }

    return ordered;
  };

  // 获取单个角色
  const getAgent = async (
    uuid: string,
    language: string = "en-US",
  ): Promise<ValorantAgent | null> => {
    const { data } = await useFetch<ValorantApiResponse<ValorantAgent>>(
      `${API_BASE}/agents/${uuid}`,
      {
        query: { language },
      },
    );
    return data.value?.data || null;
  };

  // 通过名称查找角色
  const getAgentByName = async (
    name: string,
    language: string = "en-US",
  ): Promise<ValorantAgent | null> => {
    const agents = await getAgents(language);
    return (
      agents.find(
        (a) =>
          a.displayName.toLowerCase() === name.toLowerCase() ||
          a.developerName.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  };

  // 获取所有地图 (按名称字母排序)
  const getMaps = async (
    language: string = "en-US",
  ): Promise<ValorantMap[]> => {
    const { data } = await useFetch<ValorantApiResponse<ValorantMap[]>>(
      `${API_BASE}/maps`,
      {
        query: { language },
      },
    );
    // 过滤掉练习场等非标准地图，并按名称字母排序
    return (data.value?.data || [])
      .filter(
        (map) =>
          map.tacticalDescription !== null &&
          !map.displayName.toLowerCase().includes("range"),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  // 获取单个地图
  const getMap = async (
    uuid: string,
    language: string = "en-US",
  ): Promise<ValorantMap | null> => {
    const { data } = await useFetch<ValorantApiResponse<ValorantMap>>(
      `${API_BASE}/maps/${uuid}`,
      {
        query: { language },
      },
    );
    return data.value?.data || null;
  };

  // 通过名称查找地图
  const getMapByName = async (
    name: string,
    language: string = "en-US",
  ): Promise<ValorantMap | null> => {
    const maps = await getMaps(language);
    return (
      maps.find((m) => m.displayName.toLowerCase() === name.toLowerCase()) ||
      null
    );
  };

  // 将 ability slot 转换为快捷键
  // 根据 Valorant 官方按键绑定:
  // - Ability1 (Basic) -> Q
  // - Ability2 (Signature) -> E
  // - Grenade (Basic) -> C
  // - Ultimate -> X
  const abilitySlotToKey = (slot: string): string => {
    const mapping: Record<string, string> = {
      Ability1: "Q",
      Ability2: "E",
      Grenade: "C",
      Ultimate: "X",
      Passive: "Passive",
    };
    return mapping[slot] || slot;
  };

  // 将快捷键转换为 slot
  const keyToAbilitySlot = (key: string): string => {
    const mapping: Record<string, string> = {
      Q: "Ability1",
      E: "Ability2",
      C: "Grenade",
      X: "Ultimate",
    };
    return mapping[key.toUpperCase()] || key;
  };

  return {
    getAgents,
    getAgentsGroupedByRole,
    getAgent,
    getAgentByName,
    getMaps,
    getMap,
    getMapByName,
    abilitySlotToKey,
    keyToAbilitySlot,
  };
};
