// Generated by CoffeeScript 1.8.0
var IGNORE_ATTRIBUTES, REGEXP, flattenMailboxTreeLevel, sanitizeHtml, _;

_ = require('lodash');

sanitizeHtml = require('sanitize-html');

REGEXP = {
  hasReOrFwD: /^(Re|Fwd)/i,
  subject: /(?:(?:Re|Fwd)(?:\[[\d+]\])?\s?:\s?)*(.*)/i,
  messageID: /<([^<>]+)>/
};

IGNORE_ATTRIBUTES = ['\\HasNoChildren', '\\HasChildren'];

module.exports = {
  isReplyOrForward: function(subject) {
    var match;
    match = subject.match(REGEXP.hasReOrFwD);
    if (match) {
      return true;
    } else {
      return false;
    }
  },
  normalizeSubject: function(subject) {
    var match;
    match = subject.match(REGEXP.subject);
    if (match) {
      return match[1];
    } else {
      return false;
    }
  },
  normalizeMessageID: function(messageID) {
    var match;
    match = messageID.match(REGEXP.messageID);
    if (match) {
      return match[1];
    } else {
      return messageID;
    }
  },
  flattenMailboxTree: function(tree) {
    var boxes, delimiter, path, root;
    boxes = [];
    if (Object.keys(tree).length === 1 && (root = tree['INBOX'])) {
      delimiter = root.delimiter;
      path = 'INBOX' + delimiter;
      boxes.push({
        label: 'INBOX',
        delimiter: delimiter,
        path: 'INBOX',
        tree: ['INBOX'],
        attribs: _.difference(root.attribs, IGNORE_ATTRIBUTES)
      });
      flattenMailboxTreeLevel(boxes, root.children, path, [], delimiter);
    } else {
      flattenMailboxTreeLevel(boxes, tree, '', [], '/');
    }
    return boxes;
  },
  sanitizeHTML: function(html, messageId, attachments) {
    var allowedAttributes, allowedTags;
    allowedTags = sanitizeHtml.defaults.allowedTags.concat(['img', 'head', 'meta']);
    allowedAttributes = sanitizeHtml.defaults.allowedAttributes;
    allowedTags.forEach(function(tag) {
      if (allowedAttributes[tag] != null) {
        return allowedAttributes[tag] = allowedAttributes[tag].concat(['style', 'class', 'background']);
      } else {
        return allowedAttributes[tag] = ['style', 'class', 'background'];
      }
    });
    html = sanitizeHtml(html, {
      allowedTags: allowedTags,
      allowedAttributes: allowedAttributes,
      allowedClasses: false,
      allowedSchemes: sanitizeHtml.defaults.allowedSchemes.concat(['cid']),
      transformTags: {
        'img': function(tag, attribs) {
          var attachment, cid, name, _ref;
          if ((attribs.src != null) && 0 === attribs.src.indexOf('cid:')) {
            cid = attribs.src.substring(4);
            attachment = attachments.filter(function(att) {
              return att.contentId === cid;
            });
            if (name = (_ref = attachment[0]) != null ? _ref.fileName : void 0) {
              attribs.src = "message/" + messageId + "/attachments/" + name;
            } else {
              attribs.src = "";
            }
          }
          return {
            tagName: 'img',
            attribs: attribs
          };
        }
      }
    });
    return html;
  }
};

flattenMailboxTreeLevel = function(boxes, children, pathStr, pathArr, parentDelimiter) {
  var child, delimiter, name, subPathArr, subPathStr, _results;
  _results = [];
  for (name in children) {
    child = children[name];
    delimiter = child.delimiter || parentDelimiter;
    subPathStr = pathStr + name + delimiter;
    subPathArr = pathArr.concat(name);
    flattenMailboxTreeLevel(boxes, child.children, subPathStr, subPathArr, delimiter);
    _results.push(boxes.push({
      label: name,
      delimiter: delimiter,
      path: pathStr + name,
      tree: subPathArr,
      attribs: _.difference(child.attribs, IGNORE_ATTRIBUTES)
    }));
  }
  return _results;
};
