import type { TiptapNode } from "@/lib/insights/document";

export type BodySaveSessionState = {
  serverHadVisibleBody: boolean;
  userEditedBody: boolean;
  bodyHadVisibleInSession: boolean;
};

export function documentHasVisibleContent(document: TiptapNode): boolean {
  function hasText(node: TiptapNode): boolean {
    if (typeof node.text === "string" && node.text.trim()) {
      return true;
    }
    if (Array.isArray(node.content)) {
      return node.content.some(hasText);
    }
    return false;
  }

  if (!Array.isArray(document.content)) {
    return false;
  }
  return document.content.some(hasText);
}

export function createBodySaveSession(serverBody: TiptapNode): BodySaveSessionState {
  const visible = documentHasVisibleContent(serverBody);
  return {
    serverHadVisibleBody: visible,
    userEditedBody: false,
    bodyHadVisibleInSession: visible,
  };
}

export function noteUserBodyEdit(
  session: BodySaveSessionState,
  bodyJson: TiptapNode,
): void {
  session.userEditedBody = true;
  if (documentHasVisibleContent(bodyJson)) {
    session.bodyHadVisibleInSession = true;
  }
}

export type BodySaveDecision = {
  includeBodyJson: boolean;
  allowEmptyBody: boolean;
};

/** Decide whether a save may send body_json (and empty overwrite confirmation). */
export function decideBodySave(
  session: BodySaveSessionState,
  bodyJson: TiptapNode,
): BodySaveDecision {
  if (documentHasVisibleContent(bodyJson)) {
    return { includeBodyJson: true, allowEmptyBody: false };
  }

  if (!session.serverHadVisibleBody) {
    return { includeBodyJson: true, allowEmptyBody: false };
  }

  if (!session.userEditedBody) {
    return { includeBodyJson: false, allowEmptyBody: false };
  }

  if (session.bodyHadVisibleInSession) {
    return { includeBodyJson: true, allowEmptyBody: true };
  }

  return { includeBodyJson: false, allowEmptyBody: false };
}
