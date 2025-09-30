class PlantaoSystem {
    constructor() {
        this.selectedMonth = null;
        this.selectedYear = null;
        this.plantonistas = [];
        this.currentPlantonistaIndex = 0;
        this.availability = {};
        this.finalSchedule = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateYearSelect();
        this.loadFromStorage();
    }

    setupEventListeners() {
        // Configuração inicial
        document.getElementById('add-plantonista').addEventListener('click', () => this.addPlantonista());
        document.getElementById('plantonista-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlantonista();
        });
        document.getElementById('start-selection').addEventListener('click', () => this.startSelection());

        // Seleção de disponibilidade
        document.getElementById('clear-selection').addEventListener('click', () => this.clearSelection());
        document.getElementById('confirm-selection').addEventListener('click', () => this.confirmSelection());

        // Administração
        document.getElementById('auto-organize').addEventListener('click', () => this.autoOrganize());
        document.getElementById('export-schedule').addEventListener('click', () => this.showExportModal());
        document.getElementById('reset-system').addEventListener('click', () => this.resetSystem());

        // Modal de exportação
        document.querySelector('.close').addEventListener('click', () => this.hideExportModal());
        document.getElementById('export-pdf').addEventListener('click', () => this.exportToPDF());
        document.getElementById('export-excel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('export-txt').addEventListener('click', () => this.exportToText());

        // Mudanças nos selects
        document.getElementById('month-select').addEventListener('change', () => this.updateCalendar());
        document.getElementById('year-select').addEventListener('change', () => this.updateCalendar());
    }

    populateYearSelect() {
        const yearSelect = document.getElementById('year-select');
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    }

    addPlantonista() {
        const nameInput = document.getElementById('plantonista-name');
        const name = nameInput.value.trim();

        if (!name) {
            this.showMessage('Por favor, digite um nome válido.', 'error');
            return;
        }

        if (this.plantonistas.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            this.showMessage('Este plantonista já foi adicionado.', 'error');
            return;
        }

        this.plantonistas.push({
            name: name,
            completed: false
        });

        nameInput.value = '';
        this.updatePlantonistasList();
        this.saveToStorage();
        
        if (this.plantonistas.length >= 2) {
            document.getElementById('start-selection').style.display = 'block';
        }
    }

    removePlantonista(index) {
        const plantonista = this.plantonistas[index];
        if (confirm(`Tem certeza que deseja remover ${plantonista.name}?`)) {
            this.plantonistas.splice(index, 1);
            delete this.availability[plantonista.name];
            this.updatePlantonistasList();
            this.saveToStorage();
            
            if (this.plantonistas.length < 2) {
                document.getElementById('start-selection').style.display = 'none';
            }
        }
    }

    updatePlantonistasList() {
        const container = document.getElementById('plantonistas-list');
        container.innerHTML = '';

        this.plantonistas.forEach((plantonista, index) => {
            const item = document.createElement('div');
            item.className = `plantonista-item ${plantonista.completed ? 'completed' : ''}`;
            
            item.innerHTML = `
                <div>
                    <div class="name">${plantonista.name}</div>
                    <div class="status">
                        ${plantonista.completed ? 
                            `✓ Disponibilidade confirmada (${this.availability[plantonista.name]?.length || 0} dias)` : 
                            'Aguardando seleção de disponibilidade'
                        }
                    </div>
                </div>
                <button class="remove-plantonista" onclick="plantaoSystem.removePlantonista(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            container.appendChild(item);
        });
    }

    startSelection() {
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');

        if (!monthSelect.value || !yearSelect.value) {
            this.showMessage('Por favor, selecione o mês e ano.', 'error');
            return;
        }

        this.selectedMonth = parseInt(monthSelect.value);
        this.selectedYear = parseInt(yearSelect.value);
        this.currentPlantonistaIndex = 0;

        document.getElementById('config-section').style.display = 'none';
        document.getElementById('selection-section').style.display = 'block';
        
        this.showCurrentPlantonista();
        this.generateCalendar();
    }

    showCurrentPlantonista() {
        const plantonista = this.plantonistas[this.currentPlantonistaIndex];
        document.getElementById('current-plantonista-name').textContent = plantonista.name;
        
        // Carregar seleção anterior se existir
        if (this.availability[plantonista.name]) {
            this.loadPreviousSelection(plantonista.name);
        } else {
            this.updateSelectedCount();
        }
    }

    generateCalendar() {
        const container = document.getElementById('calendar-container');
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        container.innerHTML = `
            <div class="calendar-header">
                ${monthNames[this.selectedMonth]} ${this.selectedYear}
            </div>
            <div class="calendar-grid" id="calendar-grid"></div>
        `;

        const grid = document.getElementById('calendar-grid');
        
        // Cabeçalhos dos dias da semana
        daysOfWeek.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day header';
            dayElement.textContent = day;
            grid.appendChild(dayElement);
        });

        // Calcular primeiro dia do mês e número de dias
        const firstDay = new Date(this.selectedYear, this.selectedMonth, 1).getDay();
        const daysInMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();

        // Espaços vazios antes do primeiro dia
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            grid.appendChild(emptyDay);
        }

        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            dayElement.dataset.day = day;
            
            dayElement.addEventListener('click', () => this.toggleDay(day));
            grid.appendChild(dayElement);
        }
    }

    toggleDay(day) {
        const plantonista = this.plantonistas[this.currentPlantonistaIndex];
        if (!this.availability[plantonista.name]) {
            this.availability[plantonista.name] = [];
        }

        const dayIndex = this.availability[plantonista.name].indexOf(day);
        const dayElement = document.querySelector(`[data-day="${day}"]`);

        if (dayIndex > -1) {
            // Remover dia
            this.availability[plantonista.name].splice(dayIndex, 1);
            dayElement.classList.remove('selected');
        } else {
            // Adicionar dia
            this.availability[plantonista.name].push(day);
            dayElement.classList.add('selected');
        }

        this.updateSelectedCount();
        this.saveToStorage();
    }

    updateSelectedCount() {
        const plantonista = this.plantonistas[this.currentPlantonistaIndex];
        const count = this.availability[plantonista.name]?.length || 0;
        document.getElementById('selected-count').textContent = count;
        
        const confirmBtn = document.getElementById('confirm-selection');
        confirmBtn.disabled = count < 10;
        
        if (count < 10) {
            confirmBtn.textContent = `Confirmar (mínimo 10 dias - faltam ${10 - count})`;
        } else {
            confirmBtn.textContent = `Confirmar Disponibilidade (${count} dias)`;
        }
    }

    loadPreviousSelection(plantonistaName) {
        const days = this.availability[plantonistaName] || [];
        days.forEach(day => {
            const dayElement = document.querySelector(`[data-day="${day}"]`);
            if (dayElement) {
                dayElement.classList.add('selected');
            }
        });
        this.updateSelectedCount();
    }

    clearSelection() {
        const plantonista = this.plantonistas[this.currentPlantonistaIndex];
        this.availability[plantonista.name] = [];
        
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        this.updateSelectedCount();
        this.saveToStorage();
    }

    confirmSelection() {
        const plantonista = this.plantonistas[this.currentPlantonistaIndex];
        const selectedDays = this.availability[plantonista.name]?.length || 0;

        if (selectedDays < 10) {
            this.showMessage('É necessário selecionar pelo menos 10 dias.', 'error');
            return;
        }

        // Marcar plantonista como completo
        this.plantonistas[this.currentPlantonistaIndex].completed = true;
        
        // Próximo plantonista
        this.currentPlantonistaIndex++;
        
        if (this.currentPlantonistaIndex < this.plantonistas.length) {
            // Ainda há plantonistas
            this.showCurrentPlantonista();
            this.generateCalendar();
        } else {
            // Todos completaram
            this.showAdminSection();
        }
        
        this.saveToStorage();
    }

    showAdminSection() {
        document.getElementById('selection-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'block';
        this.generateScheduleOverview();
    }

    generateScheduleOverview() {
        const container = document.getElementById('schedule-overview');
        
        let html = '<h3><i class="fas fa-chart-bar"></i> Resumo das Disponibilidades</h3>';
        
        // Tabela de disponibilidades
        html += `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Plantonista</th>
                        <th>Dias Disponíveis</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.plantonistas.forEach(plantonista => {
            const days = this.availability[plantonista.name] || [];
            html += `
                <tr>
                    <td>${plantonista.name}</td>
                    <td>${days.sort((a, b) => a - b).join(', ')}</td>
                    <td>${days.length} dias</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        
        // Mostrar escala final se existir
        if (Object.keys(this.finalSchedule).length > 0) {
            html += '<h3 style="margin-top: 30px;"><i class="fas fa-calendar-check"></i> Escala Final</h3>';
            html += `
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Dia</th>
                            <th>Plantonista</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            Object.keys(this.finalSchedule).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
                html += `
                    <tr>
                        <td>Dia ${day}</td>
                        <td>${this.finalSchedule[day]}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
        }
        
        container.innerHTML = html;
    }

    autoOrganize() {
        if (confirm('Isso irá gerar uma nova escala automaticamente. Continuar?')) {
            this.finalSchedule = {};
            
            // Obter todos os dias do mês
            const daysInMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
            const allDays = Array.from({length: daysInMonth}, (_, i) => i + 1);
            
            // Criar mapa de disponibilidade por dia
            const dayAvailability = {};
            allDays.forEach(day => {
                dayAvailability[day] = this.plantonistas.filter(plantonista => 
                    this.availability[plantonista.name]?.includes(day)
                ).map(p => p.name);
            });
            
            // Contador de plantões por plantonista
            const plantaoCount = {};
            this.plantonistas.forEach(p => plantaoCount[p.name] = 0);
            
            // Algoritmo de distribuição
            allDays.forEach(day => {
                const availablePlantonistas = dayAvailability[day];
                
                if (availablePlantonistas.length > 0) {
                    // Escolher plantonista com menos plantões
                    const chosenPlantonista = availablePlantonistas.reduce((min, current) => 
                        plantaoCount[current] < plantaoCount[min] ? current : min
                    );
                    
                    this.finalSchedule[day] = chosenPlantonista;
                    plantaoCount[chosenPlantonista]++;
                }
            });
            
            this.generateScheduleOverview();
            this.saveToStorage();
            this.showMessage('Escala gerada automaticamente!', 'success');
        }
    }

    showExportModal() {
        if (Object.keys(this.finalSchedule).length === 0) {
            this.showMessage('É necessário gerar a escala primeiro.', 'error');
            return;
        }
        document.getElementById('export-modal').style.display = 'block';
    }

    hideExportModal() {
        document.getElementById('export-modal').style.display = 'none';
    }

    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        // Título
        doc.setFontSize(20);
        doc.text(`Escala de Plantão - ${monthNames[this.selectedMonth]} ${this.selectedYear}`, 20, 30);
        
        // Cabeçalho da tabela
        doc.setFontSize(12);
        let y = 60;
        doc.text('Dia', 20, y);
        doc.text('Plantonista', 80, y);
        
        y += 10;
        doc.line(20, y, 190, y); // Linha horizontal
        
        // Dados
        Object.keys(this.finalSchedule).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
            y += 10;
            doc.text(`${day}`, 20, y);
            doc.text(this.finalSchedule[day], 80, y);
        });
        
        doc.save(`escala-plantao-${monthNames[this.selectedMonth]}-${this.selectedYear}.pdf`);
        this.hideExportModal();
    }

    exportToExcel() {
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        const data = [['Dia', 'Plantonista']];
        
        Object.keys(this.finalSchedule).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
            data.push([day, this.finalSchedule[day]]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Escala');
        
        XLSX.writeFile(wb, `escala-plantao-${monthNames[this.selectedMonth]}-${this.selectedYear}.xlsx`);
        this.hideExportModal();
    }

    exportToText() {
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        let text = `ESCALA DE PLANTÃO - ${monthNames[this.selectedMonth].toUpperCase()} ${this.selectedYear}\n`;
        text += '='.repeat(50) + '\n\n';
        
        Object.keys(this.finalSchedule).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
            text += `Dia ${day.padStart(2, '0')}: ${this.finalSchedule[day]}\n`;
        });
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `escala-plantao-${monthNames[this.selectedMonth]}-${this.selectedYear}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.hideExportModal();
    }

    resetSystem() {
        if (confirm('Isso irá apagar todos os dados. Tem certeza?')) {
            this.plantonistas = [];
            this.availability = {};
            this.finalSchedule = {};
            this.currentPlantonistaIndex = 0;
            
            localStorage.removeItem('plantaoSystemData');
            
            document.getElementById('config-section').style.display = 'block';
            document.getElementById('selection-section').style.display = 'none';
            document.getElementById('admin-section').style.display = 'none';
            document.getElementById('start-selection').style.display = 'none';
            
            document.getElementById('month-select').value = '';
            document.getElementById('plantonista-name').value = '';
            
            this.updatePlantonistasList();
            this.showMessage('Sistema reiniciado!', 'success');
        }
    }

    saveToStorage() {
        const data = {
            plantonistas: this.plantonistas,
            availability: this.availability,
            finalSchedule: this.finalSchedule,
            selectedMonth: this.selectedMonth,
            selectedYear: this.selectedYear,
            currentPlantonistaIndex: this.currentPlantonistaIndex
        };
        localStorage.setItem('plantaoSystemData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('plantaoSystemData');
        if (saved) {
            const data = JSON.parse(saved);
            this.plantonistas = data.plantonistas || [];
            this.availability = data.availability || {};
            this.finalSchedule = data.finalSchedule || {};
            this.selectedMonth = data.selectedMonth;
            this.selectedYear = data.selectedYear;
            this.currentPlantonistaIndex = data.currentPlantonistaIndex || 0;
            
            this.updatePlantonistasList();
            
            if (this.plantonistas.length >= 2) {
                document.getElementById('start-selection').style.display = 'block';
            }
            
            if (this.selectedMonth !== null) {
                document.getElementById('month-select').value = this.selectedMonth;
                document.getElementById('year-select').value = this.selectedYear;
            }
        }
    }

    updateCalendar() {
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        
        if (monthSelect.value && yearSelect.value) {
            this.selectedMonth = parseInt(monthSelect.value);
            this.selectedYear = parseInt(yearSelect.value);
            this.saveToStorage();
        }
    }

    showMessage(message, type) {
        // Remove mensagens anteriores
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = type === 'success' ? 'success-message' : 'error-message';
        messageEl.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
        
        const container = document.querySelector('.section:not([style*="display: none"])');
        container.insertBefore(messageEl, container.firstChild);
        
        setTimeout(() => messageEl.remove(), 5000);
    }
}

// Inicializar sistema quando a página carregar
let plantaoSystem;
document.addEventListener('DOMContentLoaded', () => {
    plantaoSystem = new PlantaoSystem();
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('export-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}