        // Agora podemos usar 'jspdf.jsPDF' ou 'new jspdf.jsPDF()' porque a biblioteca foi incluída separadamente
        const { jsPDF } = window.jspdf; 

        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('schedule-form');
            const eventEntriesDiv = document.getElementById('event-entries');
            const addEntryButton = document.querySelector('.add-entry');
            const scheduleOutput = document.getElementById('schedule-output');
            const scheduleHeader = document.querySelector('#schedule-output .schedule-header');
            const scheduleBody = document.getElementById('schedule-body');
            const savePdfBtn = document.getElementById('save-pdf-btn');

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

                scheduleHeader.innerHTML = `
                    <p><strong>Noivos:</strong> ${groomName} & ${brideName}</p>
                    <p><strong>Data:</strong> ${new Date(eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    <p><strong>Horário:</strong> ${eventTime}</p>
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

            // FUNÇÃO PARA SALVAR EM PDF USANDO JSPDF DIRETAMENTE
            savePdfBtn.addEventListener('click', () => {
                // Instanciação correta do jsPDF
                const doc = new jsPDF(); 

                const groomName = document.getElementById('groom-name').value;
                const brideName = document.getElementById('bride-name').value;
                const eventDate = document.getElementById('event-date').value;
                const eventTime = document.getElementById('event-time').value;

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

                let yPos = 20; // Posição Y inicial no documento
                const margin = 20;
                const lineHeight = 7; // Altura de linha padrão
                const pageHeight = doc.internal.pageSize.getHeight();

                // Título do Documento
                doc.setFontSize(22);
                doc.setTextColor(106, 5, 114); 
                doc.text('Cronograma do Casamento', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
                yPos += 15;

                // Informações dos Noivos e Data/Hora
                doc.setFontSize(12);
                doc.setTextColor(68, 68, 68); 
                doc.text(`Noivos: ${groomName} & ${brideName}`, margin, yPos);
                yPos += lineHeight;
                doc.text(`Data: ${new Date(eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, margin, yPos);
                yPos += lineHeight;
                doc.text(`Horário: ${eventTime}`, margin, yPos);
                yPos += 15; 

                // Linha divisória
                doc.setDrawColor(238, 238, 238); 
                doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
                yPos += 10;

                // Adiciona as etapas do cronograma
                doc.setFontSize(10);
                doc.setTextColor(51, 51, 51); 

                entries.forEach((entry, index) => {
                    const entryStartX = margin + 15; // Início do texto da entrada
                    const circleRadius = 7;
                    const circleTextOffset = 4; // Ajuste para o texto dentro do círculo
                    
                    let currentEntryHeight = lineHeight * 2; // Para nome e música (se houver)
                    if (entry.isGroomsmen && entry.groomsmenNames.length > 0) {
                        currentEntryHeight += (entry.groomsmenNames.length + 1) * lineHeight; // +1 para o "Padrinhos:"
                    }
                    
                    // Verifica se precisa de uma nova página antes de adicionar a entrada atual
                    if (yPos + currentEntryHeight + 15 > pageHeight - margin) { // +15 para espaçamento extra
                        doc.addPage();
                        yPos = margin; // Reset Y para nova página
                        
                        // Opcional: repetir o cabeçalho em cada nova página
                        doc.setFontSize(18);
                        doc.setTextColor(106, 5, 114);
                        doc.text('Cronograma do Casamento (Continuação)', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
                        yPos += 10;
                        doc.setDrawColor(238, 238, 238);
                        doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
                        yPos += 10;
                    }

                    // Desenha o círculo da ordem
                    doc.setFillColor(106, 5, 114); 
                    doc.circle(margin + circleRadius, yPos + circleRadius - 2, circleRadius, 'F'); 

                    // Texto da ordem (1ª, 2ª, etc.)
                    doc.setTextColor(255, 255, 255); 
                    doc.setFontSize(8); 
                    doc.text(`${entry.order}ª`, margin + circleRadius, yPos + circleRadius - 3, { align: 'center', baseline: 'middle' });
                    doc.text(`Entrada`, margin + circleRadius, yPos + circleRadius + 1, { align: 'center', baseline: 'middle' }); 

                    // Conteúdo da entrada
                    doc.setTextColor(106, 5, 114); 
                    doc.setFontSize(12);
                    doc.text(entry.name, entryStartX, yPos + (lineHeight / 2) + 2); // Ajusta Y para alinhamento com o círculo
                    let currentLineY = yPos + lineHeight + 5; // Posição para a próxima linha de texto

                    if (entry.music) {
                        doc.setTextColor(102, 102, 102); 
                        doc.setFontSize(10);
                        doc.text(`Música: ${entry.music}`, entryStartX, currentLineY);
                        currentLineY += lineHeight;
                    }

                    if (entry.isGroomsmen && entry.groomsmenNames.length > 0) {
                        doc.setTextColor(102, 102, 102); 
                        doc.setFontSize(10);
                        doc.text('Padrinhos:', entryStartX, currentLineY);
                        currentLineY += lineHeight;
                        entry.groomsmenNames.forEach(name => {
                            doc.text(`- ${name}`, entryStartX + 5, currentLineY); 
                            currentLineY += lineHeight;
                        });
                    }

                    yPos = currentLineY + 5; // Espaçamento entre as entradas
                });

                // Salva o PDF
                const filename = `Cronograma-${groomName || 'Noivos'}-${brideName || 'Noivos'}.pdf`;
                doc.save(filename);
                console.log('PDF gerado com sucesso usando jsPDF direto!');
            });
        });
    