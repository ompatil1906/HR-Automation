import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { CampaignTable } from "@/components/campaign-table";
import { PageHeader } from "@/components/ui";

export const dynamic="force-dynamic";
export default async function CampaignPage({params}:{params:Promise<{campaignId:string}>}){const{id}= {id:(await params).campaignId};const campaign=await db.campaign.findUnique({where:{id},include:{contacts:{orderBy:[{priorityScore:"desc"},{createdAt:"asc"}],include:{research:true,generatedResumes:{take:1,orderBy:{createdAt:"desc"}},generatedEmails:{take:1,orderBy:{createdAt:"desc"}},gmailDrafts:{take:1,orderBy:{createdAt:"desc"}},sentEmails:{take:1,orderBy:{createdAt:"desc"}}}}}});if(!campaign)notFound();const safe=JSON.parse(JSON.stringify(campaign));return <><PageHeader title={campaign.name} description={`${campaign.totalRows} contacts · ${campaign.uploadedFileName||"Single company outreach"}`} action={<Link className="btn btn-secondary" href={`/api/export/${campaign.id}`}><Download size={16}/> Export tracker</Link>}/><CampaignTable campaign={safe}/></>}
