package com.example.studio;

import java.time.LocalDateTime;

class Template {
  public String id, title, category, description, coverUrl;
  public int requiredImageCount;
  public long maxFileSizeBytes;
}

class Task {
  public String id, userId, templateId, templateTitle, status, stage, error, resultUrl, inputs;
  public LocalDateTime createdAt;

  Task() {}

  // The worker owns its snapshot; serializing the accepted response cannot race with it.
  Task(Task source) {
    this.id = source.id;
    this.userId = source.userId;
    this.templateId = source.templateId;
    this.templateTitle = source.templateTitle;
    this.status = source.status;
    this.stage = source.stage;
    this.error = source.error;
    this.resultUrl = source.resultUrl;
    this.inputs = source.inputs;
    this.createdAt = source.createdAt;
  }
}
