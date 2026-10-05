from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union, Literal
from enum import Enum

class DifficultyEnum(str, Enum):
    Beginner = "Beginner"
    Easy = "Easy"
    Intermediate = "Intermediate"

class ConfidenceEnum(str, Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"

class Repository(BaseModel):
    owner: str
    name: str
    url: str
    description: str
    primary_language: Optional[str]

class StructureItem(BaseModel):
    path: str
    purpose: str

class KeyComponent(BaseModel):
    name: str
    path: Optional[str]
    role: str

class Architecture(BaseModel):
    summary: str
    technologies: List[str]
    structure: List[StructureItem]
    key_components: List[KeyComponent]
    data_flow: str

class EvidenceItem(BaseModel):
    source: str
    detail: str

class Contribution(BaseModel):
    title: str
    difficulty: DifficultyEnum
    description: str
    file_paths: List[str]
    paths_verified: bool
    why_useful: str
    why_beginner_friendly: str
    evidence: List[EvidenceItem]

class ScreenshotDiagnosisUnavailable(BaseModel):
    available: Literal[False]

class ScreenshotDiagnosisAvailable(BaseModel):
    available: Literal[True]
    visible_problem: str
    observed_facts: List[str]
    likely_area: str
    likely_causes: List[str]
    likely_files: List[str]
    suggested_contribution: str
    confidence: ConfidenceEnum
    uncertainty: str

ScreenshotDiagnosis = Union[ScreenshotDiagnosisAvailable, ScreenshotDiagnosisUnavailable]

class MetaModel(BaseModel):
    model: str
    files_analyzed: List[str]
    context_truncated: bool

class AnalyzeResponse(BaseModel):
    repository: Repository
    architecture: Architecture
    contributions: List[Contribution]
    screenshot_diagnosis: ScreenshotDiagnosis
    pr_checklist: List[str]
    warnings: List[str]
    meta: MetaModel

    @field_validator('contributions')
    @classmethod
    def check_exactly_three(cls, v):
        if len(v) != 3:
            raise ValueError('Exactly 3 contributions required')
        return v
