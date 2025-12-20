export enum Allergy {
  PENICILLIN = 'penicillin',
  PEANUTS = 'peanuts',
  LATEX = 'latex',
  SHELLFISH = 'shellfish',
  DAIRY = 'dairy',
  EGG = 'egg',
  SOY = 'soy',
  WHEAT = 'wheat',
  TREE_NUTS = 'tree_nuts',
  FISH = 'fish',
  SULFA_DRUGS = 'sulfa_drugs',
  INSULIN = 'insulin',
  ASPIRIN = 'aspirin',
  IODINE = 'iodine',
  OTHER = 'other',
}

export enum ChronicCondition {
  DIABETES_TYPE_1 = 'diabetes_type_1',
  DIABETES_TYPE_2 = 'diabetes_type_2',
  HYPERTENSION = 'hypertension',
  ASTHMA = 'asthma',
  ARTHRITIS = 'arthritis',
  HEART_DISEASE = 'heart_disease',
  KIDNEY_DISEASE = 'kidney_disease',
  THYROID_DISORDER = 'thyroid_disorder',
  HIGH_CHOLESTEROL = 'high_cholesterol',
  DEPRESSION = 'depression',
  ANXIETY = 'anxiety',
  MIGRAINE = 'migraine',
  OSTEOPOROSIS = 'osteoporosis',
  OTHER = 'other',
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

// Keeping Medication open for now or we can add common ones
// For strict validation, we will treat it as strings with regex or open ended
// but request asked for class model/validation for "other columns like allergies"
