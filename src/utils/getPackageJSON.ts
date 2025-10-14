import fs from 'fs';
import path from 'path';

export interface PackageJson {
    name?: string;
    version?: string;
    description?: string;
    [key: string]: unknown;
}

export default function getPackageJSON(startDir: string): PackageJson {
    let dir = path.resolve(startDir);

    const pathCandidate = path.join(dir, 'package.json');
    if (fs.existsSync(pathCandidate)) {
        let pkgJSON: PackageJson = JSON.parse(fs.readFileSync(pathCandidate, 'utf8'));
        return pkgJSON;
    }

    return {};
}