function formatDate(ymdDate: any) {
  const [year, month, day] = ymdDate.split('-');
  return `${day}-${month}-${year}`;
}

export default formatDate;
