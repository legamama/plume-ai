import { supabase } from './supabase'

// Upload image to Supabase Storage
export async function uploadImage(file: Blob, folder: 'products' | 'generations'): Promise<string | null> {
    try {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`
        const filePath = `${folder}/${filename}`

        const { data, error } = await supabase.storage
            .from(folder)
            .upload(filePath, file, {
                contentType: 'image/png',
                cacheControl: '3600',
            })

        if (error) {
            console.error('Upload error:', error)
            throw error
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(folder)
            .getPublicUrl(filePath)

        return publicUrl
    } catch (error) {
        console.error('Error uploading image:', error)
        return null
    }
}

// Upload product with analysis
export async function saveProduct(imageData: string, analysis: string, name: string) {
    try {
        console.log('Saving product:', name)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
            console.error('Auth error:', userError)
            throw new Error(`Authentication failed: ${userError.message}`)
        }
        if (!user) throw new Error('User not authenticated')

        console.log('User authenticated:', user.id)

        // Convert base64 to blob
        const base64Response = await fetch(`data:image/jpeg;base64,${imageData}`)
        const blob = await base64Response.blob()

        // Upload image
        const imageUrl = await uploadImage(blob, 'products')
        if (!imageUrl) throw new Error('Failed to upload image')

        console.log('Image uploaded:', imageUrl)

        // Save product to database with user_id
        const { data, error } = await supabase
            .from('products')
            .insert({
                user_id: user.id,
                name,
                image_url: imageUrl,
                analysis_data: { description: analysis }
            })
            .select()
            .single()

        if (error) {
            console.error('Database error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            throw new Error(`Database error: ${error.message}`)
        }

        console.log('Product saved:', data)
        return data
    } catch (error: any) {
        console.error('Error saving product:', error)
        throw error
    }
}

// Get all products
export async function getProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching products:', error)
            throw error
        }
        return data || []
    } catch (error) {
        console.error('Error fetching products:', error)
        return []
    }
}

// Delete product
export async function deleteProduct(id: string) {
    try {
        // First delete associated generations to satisfy FK constraint
        const { error: genError } = await supabase
            .from('generations')
            .delete()
            .eq('product_id', id)
        if (genError) {
            console.error('Error deleting related generations:', genError)
            // Continue to attempt product deletion anyway
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting product:', error)
        return false
    }
}

// Save generated image
export async function saveGeneration(
    productId: string,
    imageUrl: string,
    prompt: string,
    settings: any
) {
    try {
        console.log('Saving generation for product:', productId)

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // If imageUrl is base64, upload it first
        let finalImageUrl = imageUrl

        if (imageUrl.startsWith('data:')) {
            const base64Response = await fetch(imageUrl)
            const blob = await base64Response.blob()
            const uploadedUrl = await uploadImage(blob, 'generations')
            if (!uploadedUrl) throw new Error('Failed to upload generated image')
            finalImageUrl = uploadedUrl
            console.log('Generated image uploaded:', finalImageUrl)
        }

        const { data, error } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                product_id: productId,
                image_url: finalImageUrl,
                prompt,
                settings
            })
            .select()
            .single()

        if (error) {
            console.error('Generation save error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            throw error
        }

        console.log('Generation saved:', data)
        return data
    } catch (error: any) {
        console.error('Error saving generation:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            stack: error?.stack
        })
        throw error
    }
}

// Save template
export async function saveTemplate(
    name: string,
    prompt: string,
    settings: any
) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('templates')
            .insert({
                user_id: user.id,
                name,
                prompt,
                settings
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error saving template:', error)
        throw error
    }
}

// Get all templates
export async function getTemplates() {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching templates:', error)
            throw error
        }
        return data || []
    } catch (error) {
        console.error('Error fetching templates:', error)
        return []
    }
}

// Delete template
export async function deleteTemplate(id: string) {
    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting template:', error)
        return false
    }
}

// Get all generations (for gallery)
export async function getGenerations() {
    try {
        const { data, error } = await supabase
            .from('generations')
            .select(`
        *,
        products (
          name,
          image_url
        )
      `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching generations:', error)
            throw error
        }
        return data || []
    } catch (error) {
        console.error('Error fetching generations:', error)
        return []
    }
}

// Delete generation
export async function deleteGeneration(id: string) {
    try {
        const { error } = await supabase
            .from('generations')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting generation:', error)
        return false
    }
}

// Delete expired generations (should be called by a cron job)
export async function deleteExpiredGenerations() {
    try {
        const { data, error } = await supabase.rpc('delete_expired_generations')

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting expired generations:', error)
        return false
    }
}

// --- Folder & Ordering Management ---

// Create Template Folder
export async function createTemplateFolder(name: string) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('template_folders')
            .insert({
                user_id: user.id,
                name,
                order_index: 0 // Default to top
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error creating folder:', error)
        throw error
    }
}

// Get Template Folders
export async function getTemplateFolders() {
    try {
        const { data, error } = await supabase
            .from('template_folders')
            .select('*')
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching folders:', error)
        return []
    }
}

// Delete Template Folder
export async function deleteTemplateFolder(id: string) {
    try {
        const { error } = await supabase
            .from('template_folders')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting folder:', error)
        return false
    }
}

// Update Template Folder (Rename)
export async function updateTemplateFolder(id: string, name: string) {
    try {
        const { error } = await supabase
            .from('template_folders')
            .update({ name })
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error updating folder:', error)
        return false
    }
}

// Move Template to Folder
export async function moveTemplateToFolder(templateId: string, folderId: string | null) {
    try {
        const { error } = await supabase
            .from('templates')
            .update({ folder_id: folderId })
            .eq('id', templateId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error moving template:', error)
        return false
    }
}

// Update Order (Generic)
export async function updateItemOrder(table: 'products' | 'templates' | 'template_folders', items: { id: string, order_index: number }[]) {
    try {
        // In a real app, use an RPC for batch updates. Here we'll loop (less efficient but works without extra SQL setup)
        // Or better: use upsert if possible, but upsert requires all fields.
        // We'll just loop for now as lists are small.

        const updates = items.map(item =>
            supabase.from(table).update({ order_index: item.order_index }).eq('id', item.id)
        )

        await Promise.all(updates)
        return true
    } catch (error) {
        console.error(`Error updating order for ${table}:`, error)
        return false
    }
}
