window.addEventListener('load', () => {
    fetch('./../data.json')
    .then((response) => response.json())
    .then((data) => handleData(data));
});

function handleData(data) {
    const salaryItemContainer = document.querySelector('.salary-item-container');
    const salaryItemTemplate = document.getElementById('detail-item');

    if (salaryItemContainer === null || salaryItemTemplate === null) {
        console.error('Not all elements are provided for a functional page.');
        return;
    }

    data.forEach(salaryData => {
        const templateClone = salaryItemTemplate.content.cloneNode(true);

        templateClone.querySelector('.summary-date').textContent = salaryData.date;
        templateClone.querySelector('.summary-net').textContent = salaryData.salary.net;

        templateClone.querySelector('.age').textContent = salaryData.age;
        templateClone.querySelector('.marital-status').textContent = salaryData.maritalStatus;
        templateClone.querySelector('.kids').textContent = salaryData.kids;
        templateClone.querySelector('.reason').textContent = salaryData.reason;

        templateClone.querySelector('.region').textContent = salaryData.region;
        templateClone.querySelector('.sector').textContent = salaryData.sector;
        templateClone.querySelector('.role').textContent = salaryData.role;

        templateClone.querySelector('.net').textContent = salaryData.salary.net;
        templateClone.querySelector('.gross').textContent = salaryData.salary.gross;

        Object.entries(salaryData.benefits).forEach(benefitData => {
            const [benefitCategory, benefits] = benefitData;

            const categoryListItem = document.createElement('li');
            categoryListItem.textContent = benefitCategory;

            const categoryBenefits = document.createElement('ul');

            benefits.forEach(benefit => {
                const benefitListItem = document.createElement('li');
                benefitListItem.textContent = benefit;

                categoryBenefits.appendChild(benefitListItem);
            });

            categoryListItem.appendChild(categoryBenefits);

            templateClone.querySelector('.benefits').appendChild(categoryListItem);
        })

        salaryItemContainer.appendChild(templateClone);
    });
}