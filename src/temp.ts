const allDob = Array.from(document.querySelectorAll('[data-dob=true]'));

for (const dob of allDob) {
  const dobText = dob.textContent;

  console.log(dobText);

  if (!dobText) continue;

  const ageElement = dob.closest('[data-dob-parent]')?.querySelector('[data-age]');

  console.log(ageElement);

  if (!ageElement) continue;

  const birth = new Date(dobText);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  // Adjust if the birth date hasn't occurred yet in the current month
  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  // Adjust if the birth month hasn't occurred yet in the current year
  if (months < 0) {
    months += 12;
    years--;
  }

  ageElement.textContent = JSON.stringify({ years, months, days });
}
// Input

const filterInputRef = document.querySelector('[fs-cmsfilter-field=name]');
const filterInput = document.querySelector('[data-search-input]');

filterInput.addEventListener('input', (e) => {
  console.log(filterInputRef);
  filterInputRef.value = e.target.value;
  filterInputRef.dispatchEvent(new Event('input', { bubbles: true }));
});
