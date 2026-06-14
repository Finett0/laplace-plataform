import { people, segments } from "@/lib/sample";
import AudienceView from "./AudienceView";

export const dynamic = "force-dynamic";

export default function AudienciaPage() {
  return <AudienceView people={people} segments={segments} />;
}
