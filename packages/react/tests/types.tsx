import { createRef } from "react";
import CloudUpload from "../release/CloudUpload";
import { CloudUploadSolid } from "../release/index";

const ref = createRef<SVGSVGElement>();
<CloudUpload ref={ref} size={32} color="#A10232" title="Upload file" className="icon" onClick={event => event.currentTarget.focus()} />;
<CloudUploadSolid aria-label="Upload file" width="1em" height="1em" />;
// @ts-expect-error Markup injection is not a component input.
<CloudUpload dangerouslySetInnerHTML={{ __html: "<script/>" }} />;
// @ts-expect-error Original weights are separate components, not invented props.
<CloudUpload weight="duotone" />;
