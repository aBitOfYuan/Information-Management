document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the selected tab if not already loaded
            if (this.getAttribute('data-loaded') !== 'true') {
                loadTableData(tabId);
                this.setAttribute('data-loaded', 'true');
            }
        });
    });
    
    // Sign out button functionality
    document.querySelector('.sign-out-btn').addEventListener('click', function() {
        // In a real app, this would log the user out
        alert('Sign out functionality would go here');
        // window.location.href = '/logout';
    });
    
    // Function to load table data
    async function loadTableData(tableType) {
        try {
            let endpoint, tableId;
            
            switch(tableType) {
                case 'sponsors':
                    endpoint = '/api/sponsors';
                    tableId = 'sponsorTable';
                    break;
                case 'supervisors':
                    endpoint = '/api/supervisors';
                    tableId = 'supervisorTable';
                    break;
                case 'pets':
                    endpoint = '/api/pets';
                    tableId = 'petTable';
                    break;
                case 'vaccines':
                    endpoint = '/api/vaccines';
                    tableId = 'vaccineTable';
                    break;
                case 'reactions':
                    endpoint = '/api/reactions';
                    tableId = 'reactionTable';
                    break;
                default:
                    return;
            }
            
            const response = await fetch(endpoint);
            const data = await response.json();
            populateTable(tableId, data, tableType);
        } catch (error) {
            console.error(`Error loading ${tableType} data:`, error);
            // Display error to user
            document.querySelector(`#${tableType} .table-container`).innerHTML = 
                `<div class="error">Failed to load data. Please try again later.</div>`;
        }
    }
    
    // Function to populate a table with data
    function populateTable(tableId, data, tableType) {
        const tableBody = document.querySelector(`#${tableId} tbody`);
        tableBody.innerHTML = ''; // Clear existing rows
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="100%" style="text-align: center;">No data available</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            switch(tableType) {
                case 'sponsors':
                    row.innerHTML = `
                        <td>${item.Sponsor_ID || 'N/A'}</td>
                        <td>${item.Sponsor_LN || 'N/A'}</td>
                        <td>${item.Sponsor_FN || 'N/A'}</td>
                        <td>${item.Sponsor_MI || 'N/A'}</td>
                        <td>${item.Spouse_Name || 'N/A'}</td>
                        <td><span class="status-badge ${getStatusClass(item.Sponsor_Status)}">${item.Sponsor_Status || 'N/A'}</span></td>
                        <td>${item.Grade || 'N/A'}</td>
                        <td>${item.is_Dual_Military || 'N/A'}</td>
                        <td>${item.Branch || 'N/A'}</td>
                        <td>${item.Unit || 'N/A'}</td>
                        <td>${item.Personal_Email || 'N/A'}</td>
                        <td>${item.Mail_Box || 'N/A'}</td>
                        <td>${item.Sponsor_Phone_No || 'N/A'}</td>
                        <td>${item.Work_Phone || 'N/A'}</td>
                        <td>${item.Spouse_Alt_No || 'N/A'}</td>
                        <td>${item.Preferred_Contact || 'N/A'}</td>
                        <td>${item.Supervisor_ID || 'N/A'}</td>
                    `;
                    break;
                    
                case 'supervisors':
                    row.innerHTML = `
                        <td>${item.Supervisor_ID || 'N/A'}</td>
                        <td>${item.Supervisor_Name || 'N/A'}</td>
                        <td>${item.Supervisor_Email || 'N/A'}</td>
                    `;
                    break;
                    
                case 'pets':
                    row.innerHTML = `
                        <td>${item.Microchip_No || 'N/A'}</td>
                        <td>${item.Pet_Name || 'N/A'}</td>
                        <td>${item.Sponsor_ID || 'N/A'}</td>
                        <td>${item.Species || 'N/A'}</td>
                        <td>${formatDate(item.DOB) || 'N/A'}</td>
                        <td>${item.Age || 'N/A'}</td>
                        <td>${item.Breed || 'N/A'}</td>
                        <td>${item.Color || 'N/A'}</td>
                        <td>${item.Has_Passport || 'N/A'}</td>
                        <td>${item.Sex || 'N/A'}</td>
                        <td>${item.Is_Spayed_Neutered || 'N/A'}</td>
                        <td>${item.Has_Recent_Clinic_History || 'N/A'}</td>
                        <td>${item.Clinic_Name || 'N/A'}</td>
                    `;
                    break;
                    
                case 'vaccines':
                    row.innerHTML = `
                        <td>${item.Vaccine_Lot || 'N/A'}</td>
                        <td>${item.Vaccine_Name || 'N/A'}</td>
                        <td>${item.Vaccine_Type || 'N/A'}</td>
                        <td>${item.Vaccine_Duration || 'N/A'}</td>
                    `;
                    break;
                    
                case 'reactions':
                    row.innerHTML = `
                        <td>${item.Sponsor_ID || 'N/A'}</td>
                        <td>${item.Microchip_No || 'N/A'}</td>
                        <td>${item.Vaccine_Lot || 'N/A'}</td>
                        <td>${formatDate(item.Date_Vaccination) || 'N/A'}</td>
                        <td>${formatDate(item.Vaccination_Effectiveness_Until) || 'N/A'}</td>
                        <td>${item.Has_Vaccine_Reaction || 'N/A'}</td>
                        <td>${item.Vaccine_Reaction_Symptoms || 'N/A'}</td>
                    `;
                    break;
            }
            
            tableBody.appendChild(row);
        });
    }
    
    // Helper function to format dates
    function formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    // Helper function to get status badge class
    function getStatusClass(status) {
        switch(status) {
            case 'Active Duty': return 'status-active';
            case 'Civilian': return 'status-civilian';
            case 'Retired': return 'status-retired';
            default: return '';
        }
    }
    
    // Load initial tab data
    loadTableData('sponsors');
    document.querySelector('.tab-btn[data-tab="sponsors"]').setAttribute('data-loaded', 'true');
});
