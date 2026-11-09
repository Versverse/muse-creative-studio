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
}
