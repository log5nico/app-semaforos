const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Document, Paragraph, TextRun, ImageRun, AlignmentType, SectionType } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import JSZip from 'jszip';

// XML limpio del header — sin mc:Fallback ni o:gfxdata para evitar errores de parsing
const HEADER_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<w:hdr'
  + ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
  + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
  + ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'
  + ' xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"'
  + ' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
  + ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'
  + ' mc:Ignorable="w14 wp14">'
  + '<w:p>'
  + '<w:pPr><w:jc w:val="left"/></w:pPr>'
  // Imagen background (rId1) — 18cm x 11.61cm, detrás del texto
  // 18cm = 6480000 EMU, 11.61cm = 4179600 EMU
  + '<w:r><w:drawing>'
  + '<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">'
  + '<wp:simplePos x="0" y="0"/>'
  + '<wp:positionH relativeFrom="margin"><wp:align>center</wp:align></wp:positionH>'
  + '<wp:positionV relativeFrom="paragraph"><wp:posOffset>3600000</wp:posOffset></wp:positionV>'
  + '<wp:extent cx="6480000" cy="4179600"/>'
  + '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
  + '<wp:wrapNone/>'
  + '<wp:docPr id="1" name="headerBg"/>'
  + '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
  + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
  + '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
  + '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
  + '<pic:nvPicPr><pic:cNvPr id="1" name="headerBg"/><pic:cNvPicPr/></pic:nvPicPr>'
  + '<pic:blipFill><a:blip r:embed="rId1"><a:lum bright="00000" contrast="-40000"/></a:blip><a:stretch/></pic:blipFill>'
  + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="6480000" cy="4179600"/></a:xfrm>'
  + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
  + '</pic:pic></a:graphicData></a:graphic>'
  + '</wp:anchor>'
  + '</w:drawing></w:r>'
  // Imagen logo upright (rId2) — arriba a la derecha
  + '<w:r><w:drawing>'
  + '<wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="2" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">'
  + '<wp:simplePos x="0" y="0"/>'
  + '<wp:positionH relativeFrom="margin"><wp:align>right</wp:align></wp:positionH>'
  + '<wp:positionV relativeFrom="paragraph"><wp:posOffset>-266700</wp:posOffset></wp:positionV>'
  + '<wp:extent cx="1275755" cy="1046977"/>'
  + '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
  + '<wp:wrapNone/>'
  + '<wp:docPr id="2" name="headerUpright"/>'
  + '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
  + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
  + '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
  + '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
  + '<pic:nvPicPr><pic:cNvPr id="2" name="headerUpright"/><pic:cNvPicPr/></pic:nvPicPr>'
  + '<pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
  + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1275755" cy="1046977"/></a:xfrm>'
  + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
  + '</pic:pic></a:graphicData></a:graphic>'
  + '</wp:anchor>'
  + '</w:drawing></w:r>'
  // Texto empresa — con salto de línea Word (w:br) entre las dos líneas
  + '<w:r>'
  + '<w:rPr>'
  + '<w:rFonts w:ascii="Arial Black" w:hAnsi="Arial Black"/>'
  + '<w:color w:val="002060"/>'
  + '<w:sz w:val="18"/><w:szCs w:val="18"/>'
  + '</w:rPr>'
  + '<w:t>INSTALACIONES TELECO Y MANTENIMIENTO BAHIA S.L.</w:t>'
  + '</w:r>'
  + '<w:r><w:br/></w:r>'
  + '<w:r>'
  + '<w:rPr>'
  + '<w:rFonts w:ascii="Arial Black" w:hAnsi="Arial Black"/>'
  + '<w:color w:val="002060"/>'
  + '<w:sz w:val="18"/><w:szCs w:val="18"/>'
  + '</w:rPr>'
  + '<w:t xml:space="preserve">(INTEYMA BAHIA S.L.) \u00b7 B-72287998</w:t>'
  + '</w:r>'
  + '</w:p>'
  + '</w:hdr>';

// Footer XML — sangría izquierda 12.79cm (7252 twips), Arial 8pt negrita, dos líneas
const FOOTER_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
  + '<w:p>'
  + '<w:pPr><w:ind w:left="7252"/></w:pPr>'
  + '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>'
  + '<w:t>INTEYMA BAHIA S.L.</w:t></w:r>'
  + '<w:r><w:br/></w:r>'
  + '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>'
  + '<w:t>inteymabahia@gmail.com</w:t></w:r>'
  + '</w:p>'
  + '</w:ftr>';

const UPRIGHT_URL = 'https://media.db.com/images/public/69413d9632a7348936e90d63/65d3d8c95_uprigth.png';
const BACKGROUND_URL = 'https://media.db.com/images/public/69413d9632a7348936e90d63/02f38c721_background.jpg';

async function fetchAsArrayBuffer(url) {
    const res = await fetch(url);
    return res.arrayBuffer();
}

async function patchDocxWithHeader(blob) {
    const zip = await JSZip.loadAsync(blob);

    // Descargar las imágenes del header
    const [backgroundBuf, uprightBuf] = await Promise.all([
        fetchAsArrayBuffer(BACKGROUND_URL),
        fetchAsArrayBuffer(UPRIGHT_URL),
    ]);

    // Añadir las imágenes al ZIP (rId1 = background, rId2 = upright)
    zip.file('word/media/headerBg.jpg', backgroundBuf);
    zip.file('word/media/headerUpright.png', uprightBuf);

    // Crear el archivo de relaciones para header1.xml
    const headerRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/headerBg.jpg"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/headerUpright.png"/>'
        + '</Relationships>';
    zip.file('word/_rels/header1.xml.rels', headerRels);

    // Añadir word/header1.xml y word/footer1.xml
    zip.file('word/header1.xml', HEADER_XML);
    zip.file('word/footer1.xml', FOOTER_XML);

    // Relaciones del footer (sin imágenes)
    const footerRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes">'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'
        + '</Relationships>';
    zip.file('word/_rels/footer1.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');

    // Asegurar que [Content_Types].xml incluye el header1.xml
    const contentTypesXml = await zip.file('[Content_Types].xml').async('string');
    let patchedContentTypes = contentTypesXml;
    if (!patchedContentTypes.includes('header1.xml')) {
        patchedContentTypes = patchedContentTypes.replace(
            '</Types>',
            '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>'
        );
    }
    if (!patchedContentTypes.includes('footer1.xml')) {
        patchedContentTypes = patchedContentTypes.replace(
            '</Types>',
            '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'
        );
    }
    zip.file('[Content_Types].xml', patchedContentTypes);

    // Asegurar que word/_rels/document.xml.rels referencia el header
    const relsPath = 'word/_rels/document.xml.rels';
    const relsXml = await zip.file(relsPath).async('string');
    let patchedRels = relsXml;
    if (!patchedRels.includes('header1.xml')) {
        patchedRels = patchedRels.replace(
            '</Relationships>',
            '<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/></Relationships>'
        );
    }
    if (!patchedRels.includes('footer1.xml')) {
        patchedRels = patchedRels.replace(
            '</Relationships>',
            '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'
        );
    }
    zip.file(relsPath, patchedRels);

    // Asegurar que document.xml activa el header y footer en la sección principal
    const docXml = await zip.file('word/document.xml').async('string');
    let patchedDoc = docXml;
    if (!patchedDoc.includes('rIdHeader1')) {
        patchedDoc = patchedDoc.replace(
            /<w:sectPr(\s[^>]*)?>/, 
            (match) => match + '<w:headerReference w:type="default" r:id="rIdHeader1"/>'
        );
    }
    if (!patchedDoc.includes('rIdFooter1')) {
        patchedDoc = patchedDoc.replace(
            /<w:sectPr(\s[^>]*)?>/, 
            (match) => match + '<w:footerReference w:type="default" r:id="rIdFooter1"/>'
        );
    }
    // Establecer margen superior de 3.5cm (1985 twips) en todas las secciones
    patchedDoc = patchedDoc.replace(
        /(<w:pgMar\s[^/]*?)w:top="[^"]*"/g,
        '$1w:top="1985"'
    );
    // Si no existe w:top en w:pgMar, añadirlo
    if (!patchedDoc.includes('w:top=')) {
        patchedDoc = patchedDoc.replace(
            /<w:pgMar/g,
            '<w:pgMar w:top="1985"'
        );
    }
    zip.file('word/document.xml', patchedDoc);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// Conversión cm → píxeles a 96dpi
const cmToPx = (cm) => Math.round(cm * 37.795);

const IMG_WIDTH = cmToPx(5.06);
const IMG_HEIGHT = cmToPx(8.9);

const FONT = 'Eras Medium ITC';
const FONT_SIZE = 22; // 11pt en half-points

function textRun(text, extra = {}) {
    return new TextRun({ text, font: FONT, size: FONT_SIZE, ...extra });
}

function labelValueParagraph(label, value, spacing = { after: 100 }) {
    return new Paragraph({
        children: [
            new TextRun({ text: label, font: FONT, size: FONT_SIZE, bold: true }),
            new TextRun({ text: value, font: FONT, size: FONT_SIZE }),
        ],
        alignment: AlignmentType.LEFT,
        spacing,
    });
}

async function buildIncidenciaSection(incidencia) {
    const imageBuffers = await Promise.all(
        (incidencia.fotos_seguimiento || []).map(async (url) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return blob.arrayBuffer();
        })
    );

    const children = [];

    const fechaAviso = incidencia.fecha_incidente
        ? format(new Date(incidencia.fecha_incidente), "d 'de' MMMM 'de' yyyy", { locale: es })
        : '-';
    children.push(labelValueParagraph('Fecha de aviso: ', fechaAviso));
    children.push(labelValueParagraph('Ubicación: ', incidencia.semaforo_codigo || ''));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(labelValueParagraph('Observaciones: ', incidencia.descripcion || ''));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(labelValueParagraph('Clasificación de incidencia: ', incidencia.clasificacion_nombre || '-'));

    const horaInicio = incidencia.fecha_incidente
        ? format(new Date(incidencia.fecha_incidente), 'HH:mm', { locale: es })
        : '-';
    children.push(labelValueParagraph('Hora de inicio: ', horaInicio));

    const horaFin = incidencia.fecha_resolucion
        ? format(new Date(incidencia.fecha_resolucion), 'HH:mm', { locale: es })
        : '-';
    children.push(labelValueParagraph('Hora de finalización: ', horaFin));

    let duracion = '-';
    if (incidencia.fecha_incidente && incidencia.fecha_resolucion) {
        const diffMs = new Date(incidencia.fecha_resolucion) - new Date(incidencia.fecha_incidente);
        const diffMins = Math.round(diffMs / 60000);
        const horas = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        duracion = horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
    }
    children.push(labelValueParagraph('Duración total: ', duracion, { after: 300 }));

    const fotos = imageBuffers;
    if (fotos.length > 0) {
        children.push(new Paragraph({
            children: [textRun('Imágenes tomadas durante la reparación:', { bold: true })],
            spacing: { after: 160 }
        }));

        for (let i = 0; i < fotos.length; i += 3) {
            const group = fotos.slice(i, i + 3);
            children.push(new Paragraph({
                children: group.flatMap((buf, idx) => {
                    const img = new ImageRun({
                        type: 'jpg',
                        data: buf,
                        transformation: { width: IMG_WIDTH, height: IMG_HEIGHT },
                    });
                    return idx < group.length - 1
                        ? [img, new TextRun({ text: '   ' })]
                        : [img];
                }),
                alignment: AlignmentType.LEFT,
                spacing: { after: 160 }
            }));
        }
    }

    return children;
}

export async function exportIncidenciaToDocx(incidencia) {
    const children = await buildIncidenciaSection(incidencia);
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const rawBlob = await import('docx').then(d => d.Packer.toBlob(doc));
    const blob = await patchDocxWithHeader(rawBlob);
    const fileName = `${incidencia.semaforo_codigo || 'incidencia'}_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
}

export async function exportIncidenciasToDocx(incidencias, label) {
    const sections = [];
    const sorted = [...incidencias].sort((a, b) =>
        new Date(a.fecha_incidente) - new Date(b.fecha_incidente)
    );

    for (let i = 0; i < sorted.length; i++) {
        const children = await buildIncidenciaSection(sorted[i]);
        sections.push({
            properties: i === 0 ? {} : { type: SectionType.NEXT_PAGE },
            children
        });
    }

    const doc = new Document({ sections });
    const rawBlob = await import('docx').then(d => d.Packer.toBlob(doc));
    const blob = await patchDocxWithHeader(rawBlob);
    const fileName = `incidencias_${label.replace(/\s+/g, '_')}.docx`;
    saveAs(blob, fileName);
}