export class CheckBoxList{

    constructor(data,chart){
        this.data = data;
        this.chart = chart;
    }

    setupCheckBoxList(){

        
        //remove checkboxes if already exist
        let data = this.data;
        
        data.forEach(element => {
            // generate id
            const id = element.replace(/\s/g, '');
            const label = document.createElement('label');
            label.setAttribute('for', id);
            const checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.id = id;
            checkBox.name = "year";
            checkBox.value = element;
            checkBox.checked = true;
            label.appendChild(checkBox);
            label.appendChild(document.createTextNode(element));
            document.querySelector('#checkBoxList').appendChild(label);
        });
        // select all checkboxes
        const checkBoxes = document.querySelectorAll('input[type=checkbox]');
        // add event listener to each checkbox
        checkBoxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const selectedCheckBoxes = document.querySelectorAll('input[type=checkbox]:checked');
                const selectedValues = Array.from(selectedCheckBoxes).map(checkbox => checkbox.value);
                //console.log(selectedValues);
                if(selectedValues.length == 1){
                    console.log("selectedValues.length == 1");
                    selectedValues.push('0' + selectedValues[0].slice(1));
                    selectedValues.push('01' + selectedValues[0].slice(2));
                    selectedValues.push('02' + selectedValues[0].slice(2));

                    console.log(selectedValues);
                }
                this.chart.update(selectedValues);
            });
        });
    }
    checkedAllCheckBoxes(){
        //checked all boxes
        const checkBoxes = document.querySelectorAll('input[type=checkbox]');
        checkBoxes.forEach(checkBox => {
            checkBox.checked = true;
        });
    }
}