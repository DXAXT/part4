const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  if (blogs.length === 0) {
      return 0;
  }
  if (blogs.length === 1) {  // No need for 'else if'
      return blogs[0].likes;
  }
  // If we get here, blogs.length is > 1, so we can use reduce directly.
  return blogs.reduce((accumulator, currentObject) => {
      return accumulator + currentObject.likes;
  }, 0);
};

module.exports = {
  dummy, totalLikes
}