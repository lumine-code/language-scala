exports.activate = function () {};

exports.consumeHyperlinkInjection = (hyperlink) => {
  return hyperlink.addInjectionPoint("source.scala", {
    types: ["comment"],
  });
};

exports.consumeTodoInjection = (todo) => {
  return todo.addInjectionPoint("source.scala", {
    types: ["comment"],
  });
};
