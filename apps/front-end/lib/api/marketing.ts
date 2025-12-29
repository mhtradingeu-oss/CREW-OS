// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.


export interface CampaignDto {
  id: string;
  brandId?: string;
  channelId?: string;
  name: string;
  objective?: string;
  budget?: number | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCampaigns(params?: Record<string, unknown>): Promise<CampaignDto[]> {
  return [];
}

export async function createCampaign(_payload: Partial<CampaignDto>): Promise<null> {
  return null;
}

export async function updateCampaign(_id: string, _payload: Partial<CampaignDto>): Promise<null> {
  return null;
}

export async function getCampaign(_id: string): Promise<CampaignDto | null> {
  return null;
}

export async function deleteCampaign(id: string) {
  await api.delete(`/marketing/${id}`);
}
