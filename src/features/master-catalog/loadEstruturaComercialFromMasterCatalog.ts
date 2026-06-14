import { masterCatalogApi } from "../../api/modules/master-catalog.api";
import { masterCatalogToEstruturaComercial } from "./masterCatalogToEstruturaComercial.mapper";

export const loadEstruturaComercialFromMasterCatalog = async () => {
  const tree = await masterCatalogApi.getCatalogTree({ status: "ACTIVE" });
  return masterCatalogToEstruturaComercial(tree);
};
