import marked from 'marked';
import * as Sqrl from 'squirrelly';
import { GenerateDocumentMessage } from "./types";

const makeEmail = async (
    content: Record<string, unknown>,
    emlContent: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filename: string,
    emailAttachments: Record<string, string> = {}
) => {
    Sqrl.helpers.define('addAttachment', function (str) {
        const attachment = emailAttachments[str.params[0].name]
        return attachment
    });
    let result: string = await Sqrl.render(atob(emlContent.replace('data:application/octet-stream;base64,', '')), content, { async: true, asyncHelpers: ['addAttachment'] })
    const resultArray = result.split('----boundary_text_string');
    marked.setOptions({ 'breaks': true, "gfm": true });
    resultArray[1] = await marked.parse(resultArray[1]);
    result = resultArray.join('----boundary_text_string \n');
    result = result.replace('<p>Content-Type: text/html</p>', 'Content-Type: text/html \n');
    return result;
}

window.addEventListener<"message">('message', async (event: { data: GenerateDocumentMessage }) => {
    if (event.data.type !== 'generate-email') return;
    const { dataSet, base64Template, correspondenceDescription, emailAttachments } = event.data.data
    const correspondence = await makeEmail(dataSet, base64Template, correspondenceDescription, emailAttachments);
    window.parent.postMessage({ type: correspondenceDescription, correspondence }, "*");
})