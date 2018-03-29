import React from "react";
var htmlparser = require("./vendor/htmlparser2");
var entities = require("./vendor/entities");

import { View, Text } from "react-native";
var Image = require("./helper/Image");

var LINE_BREAK = "\n";
var PARAGRAPH_BREAK = "\n\n";
var BULLET = "\u2022 ";

function getStyle(node) {
  let result = {};
  if (typeof node.attribs.style === "string") {
    const style = node.attribs.style.split(" ").join("");
    const newStyles = style.split(";");
    newStyles.map(newStyle => {
      const newElem = newStyle.split(":");
      const key = newElem[0];
      const value = newElem[1];

      if (key !== "") {
        result[key] = value;
      }
    });

    if (style.includes("font-weight:bold")) {
      result.fontWeight = "bold";
    }
    if (style.includes("text-decoration:underline")) {
      result.textDecorationLine = "underline";
    }
    if (style.includes("text-decoration:line-through")) {
      result.textDecorationLine = "line-through";
    }
    if (style.includes("font-style:italic")) {
      result.fontStyle = "italic";
    }
  }
  return result;
}

function htmlToElement(rawHtml, opts, done) {
  function domToElement(dom, parent) {
    if (!dom) return null;

    return dom.map((node, index, list) => {
      if (opts.customRenderer) {
        var rendered = opts.customRenderer(node, index, list);
        if (rendered || rendered === null) return rendered;
      }

      if (node.type == "text") {
        return (
          <Text
            key={index}
            style={[opts.stylesheet, parent ? opts.styles[parent.name] : {}]}
          >
            {entities.decodeHTML(node.data)}
          </Text>
        );
      }

      if (node.type == "tag") {
        const baseStyle = getStyle(node);
        if (node.name == "img") {
          var img_w =
            +node.attribs["width"] || +node.attribs["data-width"] || 0;
          var img_h =
            +node.attribs["height"] || +node.attribs["data-height"] || 0;

          var img_style = {
            width: img_w,
            height: img_h
          };
          var source = {
            uri: node.attribs.src,
            width: img_w,
            height: img_h
          };
          return <Image key={index} source={source} style={img_style} />;
        }
        if (node.name === "strong") {
          return (
            <Text style={{ fontWeight: "bold" }}>
              {domToElement(node.children, node)}
            </Text>
          );
        }

        var linkPressHandler = null;
        if (node.name == "a" && node.attribs && node.attribs.href) {
          linkPressHandler = () =>
            opts.linkHandler(entities.decodeHTML(node.attribs.href));
        }

        return (
          <Text key={index} style={baseStyle} onPress={linkPressHandler}>
            {node.name == "pre" || node.name == "div" ? LINE_BREAK : null}
            {node.name == "li" ? BULLET : null}
            {domToElement(node.children, node)}
            {node.name == "br" || node.name == "li" ? LINE_BREAK : null}
            {node.name == "p" && index < list.length - 1
              ? PARAGRAPH_BREAK
              : null}
            {node.name == "h1" ||
            node.name == "h2" ||
            node.name == "h3" ||
            node.name == "h4" ||
            node.name == "h5"
              ? LINE_BREAK
              : null}
          </Text>
        );
      }
    });
  }

  var handler = new htmlparser.DomHandler(function(err, dom) {
    if (err) done(err);
    done(null, domToElement(dom));
  });
  var parser = new htmlparser.Parser(handler);
  parser.write(rawHtml);
  parser.done();
}

module.exports = htmlToElement;
