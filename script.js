// Acessa o construtor jsPDF
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('schedule-form');
    const eventEntriesDiv = document.getElementById('event-entries');
    const addEntryButton = document.querySelector('.add-entry');
    const scheduleOutput = document.getElementById('schedule-output');
    const scheduleHeader = document.querySelector('#schedule-output .schedule-header');
    const scheduleBody = document.getElementById('schedule-body');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const eventLogoInput = document.getElementById('event-logo');
    const colorPaletteSelect = document.getElementById('color-palette');

    savePdfBtn.style.display = 'none';

    addEntryButton.addEventListener('click', () => {
        addEntry();
    });

    eventEntriesDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-entry')) {
            e.target.closest('.entry-item').remove();
        } else if (e.target.classList.contains('is-groomsmen')) {
            const padrinhosNamesDiv = e.target.closest('.entry-item').querySelector('.padrinhos-names');
            if (e.target.checked) {
                padrinhosNamesDiv.style.display = 'block';
            } else {
                padrinhosNamesDiv.style.display = 'none';
            }
        }
    });

    function addEntry() {
        const entryItem = document.createElement('div');
        entryItem.classList.add('entry-item');
        entryItem.innerHTML = `
            <label>Nome da Entrada:</label>
            <input type="text" class="entry-name" placeholder="Ex: Entrada da Noiva" required>

            <label>Música:</label>
            <input type="text" class="entry-music" placeholder="Ex: Marcha Nupcial">

            <label>Ordem:</label>
            <input type="number" class="entry-order" min="1" value="${eventEntriesDiv.children.length + 1}" required>

            <div>
                <input type="checkbox" class="is-groomsmen">
                <label for="is-groomsmen">Padrinhos?</label>
            </div>

            <div class="padrinhos-names" style="display: none;">
                <label>Nomes dos Padrinhos (um por linha):</label>
                <textarea class="groomsmen-names"></textarea>
            </div>

            <button type="button" class="remove-entry">Remover</button>
        `;
        eventEntriesDiv.appendChild(entryItem);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const groomName = document.getElementById('groom-name').value;
        const brideName = document.getElementById('bride-name').value;
        const eventDate = document.getElementById('event-date').value;
        const eventTime = document.getElementById('event-time').value;
        const eventLocation = document.getElementById('event-location').value;

        scheduleHeader.innerHTML = `
            <p><strong>Noivos:</strong> ${groomName} & ${brideName}</p>
            <p><strong>Data:</strong> ${new Date(eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p><strong>Horário:</strong> ${eventTime}</p>
            <p><strong>Local:</strong> ${eventLocation}</p>
        `;

        const entries = [];
        document.querySelectorAll('.entry-item').forEach(item => {
            const name = item.querySelector('.entry-name').value;
            const music = item.querySelector('.entry-music').value;
            const order = parseInt(item.querySelector('.entry-order').value);
            const isGroomsmen = item.querySelector('.is-groomsmen').checked;
            const groomsmenNames = isGroomsmen ? item.querySelector('.groomsmen-names').value.split('\n').filter(n => n.trim() !== '') : [];

            entries.push({ name, music, order, isGroomsmen, groomsmenNames });
        });

        entries.sort((a, b) => a.order - b.order);

        scheduleBody.innerHTML = '';
        entries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('schedule-entry');

            let groomsmenHtml = '';
            if (entry.isGroomsmen && entry.groomsmenNames.length > 0) {
                groomsmenHtml = `
                    <ul class="groomsmen-list">
                        ${entry.groomsmenNames.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                `;
            }

            entryDiv.innerHTML = `
                <span class="order">${entry.order}ª Entrada</span>
                <div class="details">
                    <p><strong>${entry.name}</strong></p>
                    ${entry.music ? `<p>Música: ${entry.music}</p>` : ''}
                    ${groomsmenHtml}
                </div>
            `;
            scheduleBody.appendChild(entryDiv);
        });

        scheduleOutput.style.display = 'block';
        scheduleOutput.offsetHeight;
        scheduleOutput.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            savePdfBtn.style.display = 'block';
        }, 500);
    });

    // Função auxiliar para converter RGB para Grayscale (luminância)
    function rgbToGrayscale(r, g, b) {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        return [gray, gray, gray];
    }

    // FUNÇÃO PARA SALVAR EM PDF USANDO JSPDF DIRETAMENTE (VERSÃO COM FEEDBACK E LOGO CENTRALIZADO)
    savePdfBtn.addEventListener('click', () => {
        loadingOverlay.style.display = 'flex'; // Mostra o overlay

        const selectedPalette = colorPaletteSelect.value;
        const isGrayscale = (selectedPalette === 'grayscale');

        const loadImagePromise = new Promise((resolve) => {
            const file = eventLogoInput.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Carrega a imagem para obter suas dimensões
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            dataUrl: e.target.result,
                            width: img.width,
                            height: img.height
                        });
                    };
                    img.onerror = () => {
                        console.error("Erro ao carregar as dimensões da imagem.");
                        resolve(null);
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    console.error("Erro ao ler o arquivo da imagem.");
                    resolve(null);
                };
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        });

        loadImagePromise.then((imageData) => {
            try {
                const doc = new jsPDF();

                const groomName = document.getElementById('groom-name').value;
                const brideName = document.getElementById('bride-name').value;
                const eventDate = document.getElementById('event-date').value;
                const eventTime = document.getElementById('event-time').value;
                const eventLocation = document.getElementById('event-location').value;

                const entries = [];
                document.querySelectorAll('.entry-item').forEach(item => {
                    const name = item.querySelector('.entry-name').value;
                    const music = item.querySelector('.entry-music').value;
                    const order = parseInt(item.querySelector('.entry-order').value);
                    const isGroomsmen = item.querySelector('.is-groomsmen').checked;
                    const groomsmenNames = isGroomsmen ? item.querySelector('.groomsmen-names').value.split('\n').filter(n => n.trim() !== '') : [];
                    entries.push({ name, music, order, isGroomsmen, groomsmenNames });
                });
                entries.sort((a, b) => a.order - b.order);

                let yPos = 20;
                const margin = 20;
                const pageHeight = doc.internal.pageSize.getHeight();
                const pageWidth = doc.internal.pageSize.getWidth();
                
                let mainColor, secondaryColor, tertiaryColor, borderColor;

                switch (selectedPalette) {
                    case 'color':
                        mainColor = [106, 5, 114];
                        secondaryColor = [68, 68, 68];
                        tertiaryColor = [102, 102, 102];
                        borderColor = [238, 238, 238];
                        break;
                    case 'blue-green':
                        mainColor = [30, 144, 255];
                        secondaryColor = [13, 33, 79];
                        tertiaryColor = [100, 149, 237];
                        borderColor = [200, 220, 240];
                        break;
                    case 'warm-tones':
                        mainColor = [139, 69, 19];
                        secondaryColor = [139, 69, 19];
                        tertiaryColor = [210, 105, 30];
                        borderColor = [250, 230, 210];
                        break;
                    case 'grayscale':
                    default:
                        mainColor = rgbToGrayscale(106, 5, 114);
                        secondaryColor = rgbToGrayscale(68, 68, 68);
                        tertiaryColor = rgbToGrayscale(102, 102, 102);
                        borderColor = rgbToGrayscale(238, 238, 238);
                        break;
                }
                
                const whiteColor = [255, 255, 255];

                // --- Inclusão do Logotipo/Monograma Centralizado ---
                if (imageData) {
                    const imgWidth = 30; // Largura desejada para a imagem (em mm)
                    let imgHeight;

                    // Verifica se as dimensões da imagem foram carregadas corretamente
                    if (imageData.width > 0 && imageData.height > 0) {
                        imgHeight = (imgWidth / imageData.width) * imageData.height;
                    } else {
                        // Fallback para uma altura padrão se as dimensões não forem válidas
                        console.warn("Dimensões da imagem não válidas, usando altura padrão de 50mm.");
                        imgHeight = 30; 
                    }

                    const imgX = (pageWidth - imgWidth) / 2;
                    const imgY = 15;

                    doc.addImage(imageData.dataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight, null, isGrayscale ? 'FAST' : null);
                    
                    yPos = imgY + imgHeight + 10;
                } else {
                    yPos = 30;
                }

                // --- Cabeçalho do PDF ---
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(28);
                doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
                doc.text('Cronograma do Casamento', pageWidth / 2, yPos, { align: 'center' });
                yPos += 18;

                doc.setFontSize(14);
                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.setFont('helvetica', 'normal');
                doc.text(`Noivos: ${groomName} e ${brideName}`, pageWidth / 2, yPos, { align: 'center' });
                yPos += 8;
                doc.text(`Data: ${new Date(eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - Horário: ${eventTime}`, pageWidth / 2, yPos, { align: 'center' });
                yPos += 8;
                doc.text(`Local: ${eventLocation}`, pageWidth / 2, yPos, { align: 'center' });
                yPos += 15;

                // Linha divisória robusta
                doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                doc.setLineWidth(0.8);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 15;

                // --- Etapas do Cronograma ---
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

                entries.forEach((entry, index) => {
                    const circleRadius = 7;
                    const entryTextStartX = margin + circleRadius * 2 + 5;

                    let contentHeight = 0;

                    contentHeight += 7;
                    if (entry.music) contentHeight += 6;
                    if (entry.isGroomsmen && entry.groomsmenNames.length > 0) {
                        contentHeight += 8;
                        contentHeight += entry.groomsmenNames.length * 5;
                    }
                    contentHeight += 10;

                    if (yPos + contentHeight > pageHeight - margin) {
                        doc.addPage();
                        yPos = margin;

                        // Título de continuação
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(18);
                        doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
                        doc.text('Cronograma (Continuação)', pageWidth / 2, yPos + 5, { align: 'center' });
                        yPos += 15;
                        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                        doc.setLineWidth(0.5);
                        doc.line(margin, yPos, pageWidth - margin, yPos);
                        yPos += 10;
                        doc.setFont('helvetica', 'normal');
                    }

                    // Desenha o círculo da ordem
                    doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
                    doc.circle(margin + circleRadius, yPos + circleRadius + 2, circleRadius, 'F');

                    // Texto da ordem (1ª, 2ª, etc.)
                    doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${entry.order}ª`, margin + circleRadius, yPos + circleRadius + 0, { align: 'center', baseline: 'middle' });
                    doc.text(`Entrada`, margin + circleRadius, yPos + circleRadius + 4, { align: 'center', baseline: 'middle' });
                    doc.setFont('helvetica', 'normal');

                    // Conteúdo da entrada
                    doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
                    doc.setFontSize(13);
                    doc.text(entry.name, entryTextStartX, yPos + 5);
                    let currentLineY = yPos + 12;

                    if (entry.music) {
                        doc.setTextColor(tertiaryColor[0], tertiaryColor[1], tertiaryColor[2]);
                        doc.setFontSize(11);
                        doc.text(`Música: ${entry.music}`, entryTextStartX, currentLineY);
                        currentLineY += 6;
                    }

                    if (entry.isGroomsmen && entry.groomsmenNames.length > 0) {
                        doc.setTextColor(tertiaryColor[0], tertiaryColor[1], tertiaryColor[2]);
                        doc.setFontSize(11);
                        doc.text('Padrinhos:', entryTextStartX, currentLineY);
                        currentLineY += 5;
                        entry.groomsmenNames.forEach(name => {
                            doc.text(`- ${name}`, entryTextStartX + 5, currentLineY);
                            currentLineY += 5;
                        });
                    }

                    yPos = currentLineY + 8;
                });

                // --- Rodapé (Número da Página) ---
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFontSize(10);
                    doc.setTextColor(tertiaryColor[0], tertiaryColor[1], tertiaryColor[2]);
                    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                }

                // Salva o PDF
                const filename = `Cronograma-${groomName || 'Noivos'}-${brideName || 'Noivos'}.pdf`;
                doc.save(filename);
                console.log('PDF gerado com sucesso usando jsPDF direto e profissional!');

            } catch (error) {
                console.error("Erro durante a geração do PDF:", error);
                alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
            } finally {
                loadingOverlay.style.display = 'none';
            }
        }).catch(error => {
            console.error("Erro na Promise de carregamento da imagem:", error);
            alert("Ocorreu um erro ao carregar a imagem. Verifique o console.");
            loadingOverlay.style.display = 'none';
        });
    });
});